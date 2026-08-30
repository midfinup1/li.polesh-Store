package service

import (
	"strings"
	"testing"
)

func TestValidateExactOrderIDs(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		requested []int64
		existing  []int64
		wantErr   bool
	}{
		{name: "valid reorder", requested: []int64{3, 1, 2}, existing: []int64{1, 2, 3}},
		{name: "missing id", requested: []int64{1, 2}, existing: []int64{1, 2, 3}, wantErr: true},
		{name: "duplicate id", requested: []int64{1, 1, 3}, existing: []int64{1, 2, 3}, wantErr: true},
		{name: "unknown id", requested: []int64{1, 2, 4}, existing: []int64{1, 2, 3}, wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateExactOrderIDs(test.requested, test.existing, "ids")
			if (err != nil) != test.wantErr {
				t.Fatalf("validateExactOrderIDs() error = %v, wantErr %v", err, test.wantErr)
			}
		})
	}
}

func TestValidateNamedCollection(t *testing.T) {
	tests := []struct {
		name    string
		nameRU  string
		nameEN  string
		slug    string
		wantErr bool
	}{
		{name: "valid", nameRU: "Картины", nameEN: "Paintings", slug: "paintings"},
		{name: "missing name", slug: "paintings", wantErr: true},
		{name: "invalid slug", nameRU: "Картины", slug: "Paintings!", wantErr: true},
		{name: "too long", nameRU: strings.Repeat("а", 301), slug: "paintings", wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateNamedCollection(test.nameRU, test.nameEN, test.slug)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateNamedCollection() error = %v, wantErr %v", err, test.wantErr)
			}
		})
	}
}
