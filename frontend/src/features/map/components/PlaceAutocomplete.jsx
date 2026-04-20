import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TextField, Autocomplete, InputAdornment, CircularProgress, Typography, Box } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { debounce } from '@mui/material/utils';

const PlaceAutocomplete = ({ 
  label, 
  placeholder, 
  icon, 
  value, 
  onChange, 
  disabled,
  required = false,
  sx = {} 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    const initServices = () => {
      if (window.google?.maps?.places) {
        if (!autocompleteService.current) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        if (!placesService.current) {
          const dummyDiv = document.createElement('div');
          placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        }
        setIsApiReady(true);
        return true;
      }
      return false;
    };

    if (!initServices()) {
      const interval = setInterval(() => {
        if (initServices()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchSuggestions = useMemo(
    () =>
      debounce((request, callback) => {
        if (autocompleteService.current) {
          autocompleteService.current.getPlacePredictions(request, callback);
        }
      }, 400),
    []
  );

  useEffect(() => {
    let active = true;

    if (!isApiReady || !autocompleteService.current || inputValue === '') {
      setOptions(value ? [value] : []);
      setError(null);
      return undefined;
    }

    setLoading(true);
    
    // Use broader types for better results
    const request = {
      input: inputValue,
      // Removed specific types to allow more flexible results (e.g. regions, specific buildings)
    };

    fetchSuggestions(request, (results, status) => {
      if (active) {
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          newOptions = [...newOptions, ...results];
          setError(null);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setError('No results found for this area');
        } else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
          console.error('Google Places API Error:', status);
          setError(status === 'REQUEST_DENIED' ? 'API Key not authorized for Places' : 'API quota exceeded');
        }

        setOptions(newOptions);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetchSuggestions]);

  const handleSelect = (event, newValue) => {
    if (!newValue) {
      onChange(null);
      return;
    }

    // If it's a prediction result, we need to get full details (lat/lng)
    if (newValue.place_id && !newValue.lat) {
      setLoading(true);
      placesService.current.getDetails(
        { placeId: newValue.place_id, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            onChange({
              address: place.formatted_address,
              name: place.name,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              place_id: newValue.place_id
            });
          }
        }
      );
    } else {
      onChange(newValue);
    }
  };

  return (
    <Autocomplete
      fullWidth
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.description || option.address || option.name || '')}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText={error || "No locations found"}
      onChange={handleSelect}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      disabled={disabled}
      loading={loading}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          required={required}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  {icon || <LocationOn sx={{ color: 'text.secondary', ml: 1 }} />}
                </InputAdornment>
                {params.InputProps?.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps?.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, alignItems, textAlign, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.5 }}>
              <LocationOn sx={{ color: 'text.secondary', mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {option.structured_formatting?.main_text || option.name || option.address}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.structured_formatting?.secondary_text || option.address || ''}
                </Typography>
              </Box>
            </Box>
          </li>
        );
      }}
    />
  );
};

export default PlaceAutocomplete;
