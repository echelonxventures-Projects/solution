package elasticsearch

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"consultancy/search-service/internal/config"
	"consultancy/search-service/internal/models"

	"github.com/olivere/elastic/v7"
)

// Client wraps Elasticsearch client
type Client struct {
	client     *elastic.Client
	config     config.ElasticsearchConfig
	searchCfg  config.SearchConfig
	autoCfg    config.AutocompleteConfig
	bulkProc   *elastic.BulkProcessor
}

func NewClient(cfg config.ElasticsearchConfig, searchCfg config.SearchConfig, autoCfg config.AutocompleteConfig) (*Client, error) {
	// Create Elasticsearch client
	client, err := elastic.NewClient(
		elastic.SetURL(cfg.URLs...),
		elastic.SetSniff(false),
		elastic.SetHealthcheck(true),
		elastic.SetHealthcheckInterval(10*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Elasticsearch client: %v", err)
	}

	// Create bulk processor for efficient indexing
	bulkProc, err := client.BulkProcessor().
		Name("SearchServiceBulkProcessor").
		Workers(2).
		BulkActions(cfg.BulkSize).
		FlushInterval(10*time.Second).
		After(func(executionId int64, requests []elastic.BulkableRequest, response *elastic.BulkResponse, err error) {
			if err != nil {
				log.Printf("Bulk processor error: %v", err)
			}
			if response.Errors {
				for _, item := range response.Items {
					for _, result := range item {
						if result.Error != nil {
							log.Printf("Bulk item error: %s - %s", result.Error.Type, result.Error.Reason)
						}
					}
				}
			}
		}).
		Do(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create bulk processor: %v", err)
	}

	es := &Client{
		client:    client,
		config:    cfg,
		searchCfg: searchCfg,
		autoCfg:   autoCfg,
		bulkProc:  bulkProc,
	}

	// Initialize indices
	if err := es.initIndices(); err != nil {
		log.Printf("Warning: Failed to initialize indices: %v", err)
	}

	return es, nil
}

// initIndices creates indices if they don't exist
func (c *Client) initIndices() error {
	ctx := context.Background()

	// Consultants index
	consultantsIndex := c.config.IndexPrefix + "_consultants"
	if err := c.createIndex(ctx, consultantsIndex, consultantMapping); err != nil {
		return err
	}

	// Content index
	contentIndex := c.config.IndexPrefix + "_content"
	if err := c.createIndex(ctx, contentIndex, contentMapping); err != nil {
		return err
	}

	// Autocomplete index
	autocompleteIndex := c.config.IndexPrefix + "_autocomplete"
	if err := c.createIndex(ctx, autocompleteIndex, autocompleteMapping); err != nil {
		return err
	}

	log.Printf("Indices initialized: %s, %s, %s", consultantsIndex, contentIndex, autocompleteIndex)
	return nil
}

// createIndex creates an index with mapping
func (c *Client) createIndex(ctx context.Context, indexName string, mapping string) error {
	exists, err := c.client.IndexExists(indexName).Do(ctx)
	if err != nil {
		return err
	}

	if !exists {
		createResp, err := c.client.CreateIndex(indexName).Body(mapping).Do(ctx)
		if err != nil {
			return err
		}
		if !createResp.Acknowledged {
			return fmt.Errorf("index creation not acknowledged: %s", indexName)
		}
	}

	return nil
}

// Search performs a search across indices
func (c *Client) Search(ctx context.Context, req models.SearchRequest) (*models.SearchResponse, error) {
	startTime := time.Now()

	// Set defaults
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = c.searchCfg.DefaultPageSize
	}
	if req.PageSize > c.searchCfg.MaxResults {
		req.PageSize = c.searchCfg.MaxResults
	}

	// Build search query
	var query elastic.Query
	if req.Query == "" || req.Query == "*" {
		query = elastic.NewMatchAllQuery()
	} else {
		// Multi-field search with boosting
		query = elastic.NewMultiMatchQuery(req.Query).
			Type("best_fields").
			Field("title^3").
			Field("name^3").
			Field("bio^2").
			Field("description^1.5").
			Field("skills^1").
			Field("verticals^1").
			Fuzziness("AUTO").
			MinimumShouldMatch("75%")
	}

	// Apply filters
	filterQueries := []elastic.Query{}

	if len(req.Filters.Verticals) > 0 {
		filterQueries = append(filterQueries, elastic.NewTermsQuery("verticals", stringsToInterfaces(req.Filters.Verticals)))
	}
	if len(req.Filters.SubVerticals) > 0 {
		filterQueries = append(filterQueries, elastic.NewTermsQuery("subVerticals", stringsToInterfaces(req.Filters.SubVerticals)))
	}
	if len(req.Filters.Skills) > 0 {
		filterQueries = append(filterQueries, elastic.NewTermsQuery("skills", stringsToInterfaces(req.Filters.Skills)))
	}
	if len(req.Filters.Languages) > 0 {
		filterQueries = append(filterQueries, elastic.NewTermsQuery("languages", stringsToInterfaces(req.Filters.Languages)))
	}
	if req.Filters.RatingMin > 0 {
		filterQueries = append(filterQueries, elastic.NewRangeQuery("rating").Gte(req.Filters.RatingMin))
	}
	if req.Filters.PriceMin > 0 || req.Filters.PriceMax > 0 {
		priceQuery := elastic.NewRangeQuery("hourlyRate")
		if req.Filters.PriceMin > 0 {
			priceQuery.Gte(req.Filters.PriceMin)
		}
		if req.Filters.PriceMax > 0 {
			priceQuery.Lte(req.Filters.PriceMax)
		}
		filterQueries = append(filterQueries, priceQuery)
	}
	if req.Filters.AvailableOnly {
		filterQueries = append(filterQueries, elastic.NewTermQuery("available", true))
	}
	if req.Filters.VerifiedOnly {
		filterQueries = append(filterQueries, elastic.NewTermQuery("verified", true))
	}

	// Combine query with filters
	if len(filterQueries) > 0 {
		query = elastic.NewBoolQuery().
			Must(query).
			Filter(filterQueries...)
	}

	// Determine which indices to search
	var indices []string
	switch req.Type {
	case "consultant":
		indices = []string{c.config.IndexPrefix + "_consultants"}
	case "content":
		indices = []string{c.config.IndexPrefix + "_content"}
	default:
		indices = []string{c.config.IndexPrefix + "_consultants", c.config.IndexPrefix + "_content"}
	}

	// Build search service
	search := c.client.Search().
		Index(indices...).
		Query(query).
		From((req.Page - 1) * req.PageSize).
		Size(req.PageSize).
		MinScore(c.searchCfg.MinScore)

	// Add sorting
	if req.SortBy != "" && req.SortBy != "relevance" {
		descending := req.SortOrder == "desc"
		search.Sort(req.SortBy, descending)
	}

	// Add highlights
	if req.Highlight && c.searchCfg.HighlightEnabled {
		highlight := elastic.NewHighlight().
			Fields(
				elastic.NewHighlighterField("title"),
				elastic.NewHighlighterField("name"),
				elastic.NewHighlighterField("bio"),
				elastic.NewHighlighterField("description"),
			).
			PreTags("<em>").
			PostTags("</em>")
		search.Highlight(highlight)
	}

	// Add facets/aggregations
	if len(req.Facets) > 0 {
		for _, facet := range req.Facets {
			search.Aggregation(facet, elastic.NewTermsAggregation().Field(facet).Size(10))
		}
	}

	// Execute search
	searchResult, err := search.Do(ctx)
	if err != nil {
		return nil, fmt.Errorf("search failed: %v", err)
	}

	// Process results
	results := []models.SearchResult{}
	for _, hit := range searchResult.Hits.Hits {
		result := models.SearchResult{
			ID:    hit.Id,
			Type:  hit.Index,
			Score: *hit.Score,
		}

		// Parse source
		var data map[string]interface{}
		if err := json.Unmarshal(hit.Source, &data); err != nil {
			log.Printf("Failed to parse hit source: %v", err)
			continue
		}

		if title, ok := data["title"].(string); ok {
			result.Title = title
		}
		if name, ok := data["name"].(string); ok {
			result.Title = name
		}
		if desc, ok := data["description"].(string); ok {
			result.Description = desc
		}
		if bio, ok := data["bio"].(string); ok {
			result.Description = bio
		}

		// Add highlights
		if hit.Highlight != nil {
			result.Highlights = make(map[string][]string)
			for field, fragments := range hit.Highlight {
				result.Highlights[field] = fragments
			}
		}

		result.Data = data
		results = append(results, result)
	}

	// Calculate total pages
	totalPages := int(searchResult.TotalHits()) / req.PageSize
	if searchResult.TotalHits()%int64(req.PageSize) > 0 {
		totalPages++
	}

	// Process facets
	facets := models.FacetResults{}
	if searchResult.Aggregations != nil {
		// Process verticals facet
		if agg, found := searchResult.Aggregations.Terms("verticals"); found {
			for _, bucket := range agg.Buckets {
				facets.Verticals = append(facets.Verticals, models.FacetItem{
					Value: bucket.Key.(string),
					Count: bucket.DocCount,
				})
			}
		}
	}

	response := &models.SearchResponse{
		Query:      req.Query,
		Results:    results,
		Total:      searchResult.TotalHits(),
		Page:       req.Page,
		PageSize:   req.PageSize,
		TotalPages: totalPages,
		Facets:     facets,
		TimeMs:     time.Since(startTime).Milliseconds(),
	}

	return response, nil
}

// Autocomplete provides autocomplete suggestions
func (c *Client) Autocomplete(ctx context.Context, req models.AutocompleteRequest) (*models.AutocompleteResponse, error) {
	if !c.autoCfg.Enabled {
		return &models.AutocompleteResponse{Query: req.Query, Suggestions: []models.Suggestion{}}, nil
	}

	if len(req.Query) < c.autoCfg.MinCharacters {
		return &models.AutocompleteResponse{Query: req.Query, Suggestions: []models.Suggestion{}}, nil
	}

	if req.Limit == 0 {
		req.Limit = c.autoCfg.MaxSuggestions
	}

	// Build completion query
	matchQuery := elastic.NewMatchQuery("suggest", req.Query).Analyzer("simple")

	var query elastic.Query = matchQuery

	// Determine index
	index := c.config.IndexPrefix + "_autocomplete"
	if req.Type != "" {
		query = elastic.NewBoolQuery().
			Must(matchQuery).
			Filter(elastic.NewTermQuery("type", req.Type))
	}

	search := c.client.Search().
		Index(index).
		Query(query).
		Size(req.Limit)

	searchResult, err := search.Do(ctx)
	if err != nil {
		return nil, err
	}

	suggestions := []models.Suggestion{}
	for _, hit := range searchResult.Hits.Hits {
		var data map[string]interface{}
		json.Unmarshal(hit.Source, &data)

		suggestion := models.Suggestion{
			Text:  data["text"].(string),
			Type:  data["type"].(string),
			Score: *hit.Score,
		}
		if id, ok := data["id"].(string); ok {
			suggestion.ID = id
		}
		suggestions = append(suggestions, suggestion)
	}

	return &models.AutocompleteResponse{
		Query:       req.Query,
		Suggestions: suggestions,
	}, nil
}

// IndexConsultant indexes a consultant document
func (c *Client) IndexConsultant(ctx context.Context, doc models.ConsultantDocument) error {
	index := c.config.IndexPrefix + "_consultants"

	req := elastic.NewBulkIndexRequest().
		Index(index).
		Id(doc.ID).
		Doc(doc)

	c.bulkProc.Add(req)

	// Also index for autocomplete
	c.indexAutocomplete(ctx, doc.ID, "consultant", doc.Name)
	for _, skill := range doc.Skills {
		c.indexAutocomplete(ctx, "", "skill", skill)
	}

	return nil
}

// IndexContent indexes a content document
func (c *Client) IndexContent(ctx context.Context, doc models.ContentDocument) error {
	index := c.config.IndexPrefix + "_content"

	req := elastic.NewBulkIndexRequest().
		Index(index).
		Id(doc.ID).
		Doc(doc)

	c.bulkProc.Add(req)

	// Also index for autocomplete
	c.indexAutocomplete(ctx, doc.ID, "content", doc.Title)

	return nil
}

// DeleteDocument deletes a document from index
func (c *Client) DeleteDocument(ctx context.Context, id string, docType string) error {
	index := c.config.IndexPrefix + "_" + docType

	req := elastic.NewBulkDeleteRequest().
		Index(index).
		Id(id)

	c.bulkProc.Add(req)

	return nil
}

// indexAutocomplete adds to autocomplete index
func (c *Client) indexAutocomplete(ctx context.Context, id string, itemType string, text string) error {
	index := c.config.IndexPrefix + "_autocomplete"

	doc := map[string]interface{}{
		"id":   id,
		"type": itemType,
		"text": text,
	}

	req := elastic.NewBulkIndexRequest().
		Index(index).
		Id(fmt.Sprintf("%s_%s", itemType, text)).
		Doc(doc)

	c.bulkProc.Add(req)

	return nil
}

// Flush flushes bulk processor
func (c *Client) Flush() error {
	return c.bulkProc.Flush()
}

// Close closes the Elasticsearch client
func (c *Client) Close() error {
	c.bulkProc.Close()
	return nil
}

// Health checks Elasticsearch health
func (c *Client) Health(ctx context.Context) (string, error) {
	health, err := c.client.ClusterHealth().Do(ctx)
	if err != nil {
		return "", err
	}
	return health.Status, nil
}

// Helper function
func stringsToInterfaces(strs []string) []interface{} {
	result := make([]interface{}, len(strs))
	for i, s := range strs {
		result[i] = s
	}
	return result
}

// Index mappings
var consultantMapping = `{
	"mappings": {
		"properties": {
			"id": {"type": "keyword"},
			"name": {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
			"title": {"type": "text", "analyzer": "standard"},
			"bio": {"type": "text", "analyzer": "standard"},
			"verticals": {"type": "keyword"},
			"subVerticals": {"type": "keyword"},
			"skills": {"type": "keyword"},
			"languages": {"type": "keyword"},
			"rating": {"type": "float"},
			"reviewCount": {"type": "integer"},
			"hourlyRate": {"type": "float"},
			"currency": {"type": "keyword"},
			"location": {"type": "text"},
			"latitude": {"type": "float"},
			"longitude": {"type": "float"},
			"available": {"type": "boolean"},
			"verified": {"type": "boolean"},
			"profileImage": {"type": "keyword"},
			"nextAvailable": {"type": "date"},
			"createdAt": {"type": "date"},
			"updatedAt": {"type": "date"},
			"status": {"type": "keyword"}
		}
	}
}`

var contentMapping = `{
	"mappings": {
		"properties": {
			"id": {"type": "keyword"},
			"title": {"type": "text", "analyzer": "standard"},
			"description": {"type": "text", "analyzer": "standard"},
			"type": {"type": "keyword"},
			"author": {"type": "text"},
			"authorId": {"type": "keyword"},
			"verticals": {"type": "keyword"},
			"duration": {"type": "integer"},
			"price": {"type": "float"},
			"currency": {"type": "keyword"},
			"thumbnail": {"type": "keyword"},
			"publishedAt": {"type": "date"},
			"viewCount": {"type": "integer"},
			"status": {"type": "keyword"},
			"tags": {"type": "keyword"},
			"createdAt": {"type": "date"},
			"updatedAt": {"type": "date"}
		}
	}
}`

var autocompleteMapping = `{
	"mappings": {
		"properties": {
			"id": {"type": "keyword"},
			"type": {"type": "keyword"},
			"text": {"type": "text", "analyzer": "simple"}
		}
	}
}`