package imageprocessor

import "testing"

func TestValidateDimensions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		width   int
		height  int
		wantErr bool
	}{
		{name: "normal camera image", width: 8000, height: 6000},
		{name: "zero width", width: 0, height: 100, wantErr: true},
		{name: "dimension too large", width: MaxImageDimension + 1, height: 1, wantErr: true},
		{name: "too many pixels", width: 10000, height: 7000, wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateDimensions(test.width, test.height)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateDimensions(%d, %d) error = %v, wantErr %v", test.width, test.height, err, test.wantErr)
			}
		})
	}
}
