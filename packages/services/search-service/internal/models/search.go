package models

import "time"

// SearchResult represents a search result
type SearchResult struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"` // consultant, content, user, booking
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Score       float64                `json:"score"`
	Highlights  map[string][]string    `json:"highlights,omitempty"`
	Data        map[string]interface{} `json:"data"`
}

// ConsultantSearchResult represents a consultant search result
type ConsultantSearchResult struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Title         string   `json:"title"`
	Bio           string   `json:"bio"`
	Verticals     []string `json:"verticals"`
	SubVerticals  []string `json:"subVerticals"`
	Skills        []string `json:"skills"`
	Rating        float64  `json:"rating"`
	ReviewCount   int      `json:"reviewCount"`
	HourlyRate    float64  `json:"hourlyRate"`
	Currency      string   `json:"currency"`
	Location      string   `json:"location"`
	Languages     []string `json:"languages"`
	Available     bool     `json:"available"`
	Verified      bool     `json:"verified"`
	ProfileImage  string   `json:"profileImage"`
	NextAvailable string   `json:"nextAvailable"`
}

// ContentSearchResult represents a content search result
type ContentSearchResult struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Type        string   `json:"type"` // course, video, document, article
	Author      string   `json:"author"`
	AuthorID    string   `json:"authorId"`
	Verticals   []string `json:"verticals"`
	Duration    int      `json:"duration"` // minutes
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	Thumbnail   string   `json:"thumbnail"`
	PublishedAt string   `json:"publishedAt"`
	ViewCount   int      `json:"viewCount"`
}

// SearchRequest represents a search request
type SearchRequest struct {
	Query        string   `json:"query" validate:"required"`
	Type         string   `json:"type"` // consultant, content, all
	Page         int      `json:"page"`
	PageSize     int      `json:"pageSize"`
	Filters      SearchFilters `json:"filters"`
	SortBy       string   `json:"sortBy"` // relevance, rating, price, popularity
	SortOrder    string   `json:"sortOrder"` // asc, desc
	Facets       []string `json:"facets"` // requested facets
	Highlight    bool     `json:"highlight"`
	Location     string   `json:"location"` // user location for geo search
}

// SearchFilters represents search filters
type SearchFilters struct {
	Verticals     []string `json:"verticals"`
	SubVerticals  []string `json:"subVerticals"`
	Skills        []string `json:"skills"`
	Languages     []string `json:"languages"`
	PriceMin      float64  `json:"priceMin"`
	PriceMax      float64  `json:"priceMax"`
	RatingMin     float64  `json:"ratingMin"`
	AvailableOnly bool     `json:"availableOnly"`
	VerifiedOnly  bool     `json:"verifiedOnly"`
	Location      string   `json:"location"`
	Radius        int      `json:"radius"` // km
	DateFrom      string   `json:"dateFrom"`
	DateTo        string   `json:"dateTo"`
	ContentType   []string `json:"contentType"` // course, video, document
	AuthorID      string   `json:"authorId"`
}

// SearchResponse represents a search response
type SearchResponse struct {
	Query       string         `json:"query"`
	Results     []SearchResult `json:"results"`
	Total       int64          `json:"total"`
	Page        int            `json:"page"`
	PageSize    int            `json:"pageSize"`
	TotalPages  int            `json:"totalPages"`
	Facets      FacetResults   `json:"facets"`
	Suggestions []string       `json:"suggestions,omitempty"`
	TimeMs      int64          `json:"timeMs"`
}

// FacetResults represents facet results
type FacetResults struct {
	Verticals     []FacetItem `json:"verticals"`
	SubVerticals  []FacetItem `json:"subVerticals"`
	Skills        []FacetItem `json:"skills"`
	Languages     []FacetItem `json:"languages"`
	PriceRanges   []FacetItem `json:"priceRanges"`
	Ratings       []FacetItem `json:"ratings"`
	ContentTypes  []FacetItem `json:"contentTypes"`
}

// FacetItem represents a facet item
type FacetItem struct {
	Value string `json:"value"`
	Count int64  `json:"count"`
}

// AutocompleteRequest represents an autocomplete request
type AutocompleteRequest struct {
	Query   string `json:"query" validate:"required"`
	Type    string `json:"type"` // consultant, content, vertical, skill
	Limit   int    `json:"limit"`
	Context string `json:"context"` // search context
}

// AutocompleteResponse represents an autocomplete response
type AutocompleteResponse struct {
	Query       string       `json:"query"`
	Suggestions []Suggestion `json:"suggestions"`
}

// Suggestion represents a suggestion
type Suggestion struct {
	Text  string `json:"text"`
	Type  string `json:"type"` // query, consultant, content, vertical, skill
	ID    string `json:"id,omitempty"`
	Score float64 `json:"score"`
}

// IndexRequest represents an index request
type IndexRequest struct {
	ID   string                 `json:"id"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

// BulkIndexRequest represents bulk index request
type BulkIndexRequest struct {
	Items []IndexRequest `json:"items"`
}

// SearchDocument represents a document to index
type SearchDocument struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Content     string                 `json:"content"`
	Tags        []string               `json:"tags"`
	Vertical    string                 `json:"vertical"`
	SubVertical string                 `json:"subVertical"`
	Author      string                 `json:"author"`
	AuthorID    string                 `json:"authorId"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// ConsultantDocument represents a consultant document for indexing
type ConsultantDocument struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Title        string    `json:"title"`
	Bio          string    `json:"bio"`
	Verticals    []string  `json:"verticals"`
	SubVerticals []string  `json:"subVerticals"`
	Skills       []string  `json:"skills"`
	Languages    []string  `json:"languages"`
	Rating       float64   `json:"rating"`
	ReviewCount  int       `json:"reviewCount"`
	HourlyRate   float64   `json:"hourlyRate"`
	Currency     string    `json:"currency"`
	Location     string    `json:"location"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Available     bool      `json:"available"`
	Verified      bool      `json:"verified"`
	ProfileImage  string    `json:"profileImage"`
	NextAvailable string    `json:"nextAvailable"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
	Status        string    `json:"status"`
}

// ContentDocument represents a content document for indexing
type ContentDocument struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	Author      string    `json:"author"`
	AuthorID    string    `json:"authorId"`
	Verticals   []string  `json:"verticals"`
	Duration    int       `json:"duration"`
	Price       float64   `json:"price"`
	Currency    string    `json:"currency"`
	Thumbnail   string    `json:"thumbnail"`
	PublishedAt time.Time `json:"publishedAt"`
	ViewCount   int       `json:"viewCount"`
	Status      string    `json:"status"`
	Tags        []string  `json:"tags"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}