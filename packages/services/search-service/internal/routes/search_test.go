package routes

import (
	"math"
	"testing"
)

func TestParseInt(t *testing.T) {
	cases := []struct {
		in     string
		def    int
		want   int
	}{
		{"42", 1, 42},
		{"0", 5, 0},
		{"12345", 0, 12345},
		{"", 10, 10},
		{"12abc", 7, 7},
		{"abc", 9, 9},
		{"-5", 3, 3},
	}
	for _, c := range cases {
		got := parseInt(c.in, c.def)
		if got != c.want {
			t.Errorf("parseInt(%q, %d) = %d, want %d", c.in, c.def, got, c.want)
		}
	}
}

func TestParseInt_DefaultUsedForInvalidInput(t *testing.T) {
	if got := parseInt("not-a-number", 25); got != 25 {
		t.Errorf("parseInt(\"not-a-number\", 25) = %d, want 25", got)
	}
}

func TestParseFloat(t *testing.T) {
	cases := []struct {
		in   string
		want float64
	}{
		{"100", 100},
		{"0", 0},
		{"12.5", 12.5},
		{"0.75", 0.75},
		{"99.99", 99.99},
		{"", 0},
	}
	for _, c := range cases {
		got := parseFloat(c.in)
		if math.Abs(got-c.want) > 1e-9 {
			t.Errorf("parseFloat(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestParseFloat_IgnoresNonNumeric(t *testing.T) {
	// The parser accumulates digits and '.' only; other chars are skipped.
	if got := parseFloat("12.5abc"); got != 12.5 {
		t.Errorf("parseFloat(\"12.5abc\") = %v, want 12.5", got)
	}
}

func TestParseArray(t *testing.T) {
	cases := []struct {
		in   string
		want []string
	}{
		{"", nil},
		{"single", []string{"single"}},
		{"a,b", []string{"a", "b"}},
		{"a,b,c", []string{"a", "b", "c"}},
		{"one,two,three", []string{"one", "two", "three"}},
	}
	for _, c := range cases {
		got := parseArray(c.in)
		if len(got) != len(c.want) {
			t.Errorf("parseArray(%q) = %v, want %v", c.in, got, c.want)
			continue
		}
		for i := range got {
			if got[i] != c.want[i] {
				t.Errorf("parseArray(%q)[%d] = %q, want %q", c.in, i, got[i], c.want[i])
			}
		}
	}
}

func TestParseArray_PreservesSpaces(t *testing.T) {
	got := parseArray("react, node")
	want := []string{"react", " node"}
	if len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Errorf("parseArray(\"react, node\") = %v, want %v", got, want)
	}
}
