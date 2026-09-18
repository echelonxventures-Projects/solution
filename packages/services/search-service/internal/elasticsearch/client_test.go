package elasticsearch

import "testing"

func TestStringsToInterfaces(t *testing.T) {
	got := stringsToInterfaces([]string{"a", "b", "c"})
	if len(got) != 3 {
		t.Fatalf("len = %d, want 3", len(got))
	}
	for i, want := range []string{"a", "b", "c"} {
		if s, ok := got[i].(string); !ok || s != want {
			t.Errorf("got[%d] = %v, want %q", i, got[i], want)
		}
	}
}

func TestStringsToInterfaces_Empty(t *testing.T) {
	got := stringsToInterfaces([]string{})
	if len(got) != 0 {
		t.Errorf("len = %d, want 0", len(got))
	}
}

func TestStringsToInterfaces_Nil(t *testing.T) {
	got := stringsToInterfaces(nil)
	if len(got) != 0 {
		t.Errorf("len = %d, want 0", len(got))
	}
}
