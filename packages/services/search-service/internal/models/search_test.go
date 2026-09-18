package models

import (
	"testing"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func TestSearchRequest_RequiresQuery(t *testing.T) {
	req := SearchRequest{Query: ""}
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for empty query, got nil")
	}

	req.Query = "react developer"
	if err := validate.Struct(req); err != nil {
		t.Errorf("expected valid request with query, got error: %v", err)
	}
}

func TestAutocompleteRequest_RequiresQuery(t *testing.T) {
	req := AutocompleteRequest{Query: ""}
	if err := validate.Struct(req); err == nil {
		t.Error("expected error for empty autocomplete query, got nil")
	}

	req.Query = "react"
	if err := validate.Struct(req); err != nil {
		t.Errorf("expected valid autocomplete request, got error: %v", err)
	}
}

func TestSearchFilters_Defaults(t *testing.T) {
	filters := SearchFilters{}
	if filters.AvailableOnly {
		t.Error("AvailableOnly default should be false")
	}
	if filters.VerifiedOnly {
		t.Error("VerifiedOnly default should be false")
	}
	if filters.Radius != 0 {
		t.Errorf("Radius default = %d, want 0", filters.Radius)
	}
}

func TestSearchRequest_Types(t *testing.T) {
	// Type is a free-form hint (no validation constraint); ensure the struct
	// accepts the documented values without error.
	for _, searchType := range []string{"consultant", "content", "all"} {
		req := SearchRequest{Query: "test", Type: searchType}
		if err := validate.Struct(req); err != nil {
			t.Errorf("type %q should be accepted: %v", searchType, err)
		}
	}
}

func TestSearchResponse_Structure(t *testing.T) {
	resp := SearchResponse{
		Query:    "react",
		Results:  []SearchResult{{ID: "1", Type: "consultant", Title: "React Expert", Score: 1.0}},
		Total:    1,
		Page:     1,
		PageSize: 10,
		TotalPages: 1,
	}
	if resp.Total != 1 {
		t.Errorf("Total = %d, want 1", resp.Total)
	}
	if len(resp.Results) != 1 {
		t.Fatalf("Results len = %d, want 1", len(resp.Results))
	}
	if resp.Results[0].Title != "React Expert" {
		t.Errorf("Results[0].Title = %q, want React Expert", resp.Results[0].Title)
	}
}

func TestAutocompleteResponse_Structure(t *testing.T) {
	resp := AutocompleteResponse{
		Query: "re",
		Suggestions: []Suggestion{{Text: "react", Type: "skill", Score: 0.9}},
	}
	if len(resp.Suggestions) != 1 {
		t.Fatalf("Suggestions len = %d, want 1", len(resp.Suggestions))
	}
	if resp.Suggestions[0].Text != "react" {
		t.Errorf("Suggestions[0].Text = %q, want react", resp.Suggestions[0].Text)
	}
}
