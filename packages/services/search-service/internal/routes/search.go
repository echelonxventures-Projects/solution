package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"consultancy/search-service/internal/config"
	"consultancy/search-service/internal/database"
	"consultancy/search-service/internal/elasticsearch"
	"consultancy/search-service/internal/models"

	"github.com/fasthttp/router"
	"github.com/valyala/fasthttp"
	"github.com/go-playground/validator/v10"
)

type Handler struct {
	Config    *config.Config
	DB        *database.DB
	ES        *elasticsearch.Client
	Validator *validator.Validate
}

func SetupRouter(cfg *config.Config, db *database.DB, es *elasticsearch.Client) *router.Router {
	router := router.New()

	h := &Handler{
		Config:    cfg,
		DB:        db,
		ES:        es,
		Validator: validator.New(),
	}

	// Health routes
	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)

	// Search routes
	router.POST("/search", h.Search)
	router.GET("/search", h.SearchGet)
	router.POST("/search/consultants", h.SearchConsultants)
	router.POST("/search/content", h.SearchContent)

	// Autocomplete routes
	router.GET("/autocomplete", h.AutocompleteGet)
	router.POST("/autocomplete", h.Autocomplete)

	// Index management routes
	router.POST("/index/consultant", h.IndexConsultant)
	router.POST("/index/content", h.IndexContent)
	router.POST("/index/bulk", h.BulkIndex)
	router.DELETE("/index/:type/:id", h.DeleteDocument)

	// Facet routes
	router.GET("/facets/:type", h.GetFacets)

	// Popular/trending routes
	router.GET("/popular/consultants", h.GetPopularConsultants)
	router.GET("/popular/content", h.GetPopularContent)
	router.GET("/trending", h.GetTrending)

	return router
}

// Health check
func (h *Handler) Health(ctx *fasthttp.RequestCtx) {
	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"status":"healthy","service":"search-service","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`)
}

func (h *Handler) Ready(ctx *fasthttp.RequestCtx) {
	// Check database
	if err := h.DB.QueryRow(context.Background(), "SELECT 1").Scan(new(int)); err != nil {
		ctx.SetStatusCode(503)
		ctx.SetBodyString(`{"ready":false,"error":"database unavailable"}`)
		return
	}

	// Check Elasticsearch
	health, err := h.ES.Health(context.Background())
	if err != nil || health != "green" && health != "yellow" {
		ctx.SetStatusCode(503)
		ctx.SetBodyString(fmt.Sprintf(`{"ready":false,"error":"elasticsearch %s"}`, health))
		return
	}

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"ready":true,"elasticsearch":"` + health + `"}`)
}

// Search handles search requests
func (h *Handler) Search(ctx *fasthttp.RequestCtx) {
	var req models.SearchRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	if err := h.Validator.Struct(req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"validation failed: %s"}`, err.Error()))
		return
	}

	// Perform search
	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(response)
}

// SearchGet handles GET search requests (query params)
func (h *Handler) SearchGet(ctx *fasthttp.RequestCtx) {
	req := models.SearchRequest{
		Query: string(ctx.QueryArgs().Peek("q")),
		Type:  string(ctx.QueryArgs().Peek("type")),
		Page:  parseInt(string(ctx.QueryArgs().Peek("page")), 1),
		PageSize: parseInt(string(ctx.QueryArgs().Peek("size")), 20),
		SortBy: string(ctx.QueryArgs().Peek("sort")),
		SortOrder: string(ctx.QueryArgs().Peek("order")),
	}

	// Parse filters from query params
	if verticals := ctx.QueryArgs().Peek("verticals"); len(verticals) > 0 {
		req.Filters.Verticals = parseArray(string(verticals))
	}
	if skills := ctx.QueryArgs().Peek("skills"); len(skills) > 0 {
		req.Filters.Skills = parseArray(string(skills))
	}
	if priceMin := ctx.QueryArgs().Peek("priceMin"); len(priceMin) > 0 {
		req.Filters.PriceMin = parseFloat(string(priceMin))
	}
	if priceMax := ctx.QueryArgs().Peek("priceMax"); len(priceMax) > 0 {
		req.Filters.PriceMax = parseFloat(string(priceMax))
	}
	if rating := ctx.QueryArgs().Peek("rating"); len(rating) > 0 {
		req.Filters.RatingMin = parseFloat(string(rating))
	}
	if string(ctx.QueryArgs().Peek("available")) == "true" {
		req.Filters.AvailableOnly = true
	}
	if string(ctx.QueryArgs().Peek("verified")) == "true" {
		req.Filters.VerifiedOnly = true
	}

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(response)
}

// SearchConsultants searches consultants specifically
func (h *Handler) SearchConsultants(ctx *fasthttp.RequestCtx) {
	var req models.SearchRequest
	json.Unmarshal(ctx.PostBody(), &req)
	req.Type = "consultant"

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response)
}

// SearchContent searches content specifically
func (h *Handler) SearchContent(ctx *fasthttp.RequestCtx) {
	var req models.SearchRequest
	json.Unmarshal(ctx.PostBody(), &req)
	req.Type = "content"

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response)
}

// Autocomplete handles autocomplete requests
func (h *Handler) Autocomplete(ctx *fasthttp.RequestCtx) {
	var req models.AutocompleteRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request body"}`)
		return
	}

	response, err := h.ES.Autocomplete(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"autocomplete failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response)
}

// AutocompleteGet handles GET autocomplete requests
func (h *Handler) AutocompleteGet(ctx *fasthttp.RequestCtx) {
	req := models.AutocompleteRequest{
		Query: string(ctx.QueryArgs().Peek("q")),
		Type:  string(ctx.QueryArgs().Peek("type")),
		Limit: parseInt(string(ctx.QueryArgs().Peek("limit")), 10),
	}

	response, err := h.ES.Autocomplete(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"autocomplete failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response)
}

// IndexConsultant indexes a consultant document
func (h *Handler) IndexConsultant(ctx *fasthttp.RequestCtx) {
	var doc models.ConsultantDocument
	if err := json.Unmarshal(ctx.PostBody(), &doc); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid document"}`)
		return
	}

	if err := h.ES.IndexConsultant(context.Background(), doc); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"indexing failed: %s"}`, err.Error()))
		return
	}

	// Flush for immediate availability
	h.ES.Flush()

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"indexed":true,"id":"` + doc.ID + `"}`)
}

// IndexContent indexes a content document
func (h *Handler) IndexContent(ctx *fasthttp.RequestCtx) {
	var doc models.ContentDocument
	if err := json.Unmarshal(ctx.PostBody(), &doc); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid document"}`)
		return
	}

	if err := h.ES.IndexContent(context.Background(), doc); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"indexing failed: %s"}`, err.Error()))
		return
	}

	h.ES.Flush()

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"indexed":true,"id":"` + doc.ID + `"}`)
}

// BulkIndex handles bulk indexing
func (h *Handler) BulkIndex(ctx *fasthttp.RequestCtx) {
	var req models.BulkIndexRequest
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		ctx.SetBodyString(`{"error":"invalid request"}`)
		return
	}

	// Process each item
	for _, item := range req.Items {
		switch item.Type {
		case "consultant":
			var doc models.ConsultantDocument
			dataBytes, _ := json.Marshal(item.Data)
			json.Unmarshal(dataBytes, &doc)
			h.ES.IndexConsultant(context.Background(), doc)
		case "content":
			var doc models.ContentDocument
			dataBytes, _ := json.Marshal(item.Data)
			json.Unmarshal(dataBytes, &doc)
			h.ES.IndexContent(context.Background(), doc)
		}
	}

	h.ES.Flush()

	ctx.SetStatusCode(200)
	ctx.SetBodyString(fmt.Sprintf(`{"indexed":%d}`, len(req.Items)))
}

// DeleteDocument deletes a document from index
func (h *Handler) DeleteDocument(ctx *fasthttp.RequestCtx) {
	docType := ctx.UserValue("type").(string)
	docID := ctx.UserValue("id").(string)

	if err := h.ES.DeleteDocument(context.Background(), docID, docType); err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"delete failed: %s"}`, err.Error()))
		return
	}

	h.ES.Flush()

	ctx.SetStatusCode(200)
	ctx.SetBodyString(`{"deleted":true}`)
}

// GetFacets returns facet counts for a type
func (h *Handler) GetFacets(ctx *fasthttp.RequestCtx) {
	docType := ctx.UserValue("type").(string)

	// Build facet search
	req := models.SearchRequest{
		Query:   "*",
		Type:    docType,
		Page:    1,
		PageSize: 0,
		Facets:  []string{"verticals", "subVerticals", "skills", "languages", "rating"},
	}

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response.Facets)
}

// GetPopularConsultants returns popular consultants
func (h *Handler) GetPopularConsultants(ctx *fasthttp.RequestCtx) {
	req := models.SearchRequest{
		Query:   "*",
		Type:    "consultant",
		SortBy:  "rating",
		SortOrder: "desc",
		Page:    1,
		PageSize: parseInt(string(ctx.QueryArgs().Peek("limit")), 10),
	}

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response.Results)
}

// GetPopularContent returns popular content
func (h *Handler) GetPopularContent(ctx *fasthttp.RequestCtx) {
	req := models.SearchRequest{
		Query:   "*",
		Type:    "content",
		SortBy:  "viewCount",
		SortOrder: "desc",
		Page:    1,
		PageSize: parseInt(string(ctx.QueryArgs().Peek("limit")), 10),
	}

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response.Results)
}

// GetTrending returns trending items
func (h *Handler) GetTrending(ctx *fasthttp.RequestCtx) {
	// Combine trending consultants and content
	req := models.SearchRequest{
		Query:   "*",
		SortBy:  "reviewCount",
		SortOrder: "desc",
		Page:    1,
		PageSize: 20,
	}

	response, err := h.ES.Search(context.Background(), req)
	if err != nil {
		ctx.SetStatusCode(500)
		ctx.SetBodyString(fmt.Sprintf(`{"error":"search failed: %s"}`, err.Error()))
		return
	}

	ctx.SetStatusCode(200)
	json.NewEncoder(ctx).Encode(response.Results)
}

// Helper functions
func parseInt(s string, defaultVal int) int {
	if s == "" {
		return defaultVal
	}
	var val int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			val = val * 10 + int(c - '0')
		} else {
			return defaultVal
		}
	}
	return val
}

func parseFloat(s string) float64 {
	if s == "" {
		return 0
	}
	var val float64
	var decimal bool
	var decimalPlaces float64 = 1
	for _, c := range s {
		if c >= '0' && c <= '9' {
			if decimal {
				val += float64(c - '0') / (decimalPlaces * 10)
				decimalPlaces *= 10
			} else {
				val = val * 10 + float64(c - '0')
			}
		} else if c == '.' {
			decimal = true
		}
	}
	return val
}

func parseArray(s string) []string {
	if s == "" {
		return nil
	}
	result := []string{}
	start := 0
	for i, c := range s {
		if c == ',' {
			result = append(result, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		result = append(result, s[start:])
	}
	return result
}