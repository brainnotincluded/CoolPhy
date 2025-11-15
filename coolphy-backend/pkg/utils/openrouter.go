package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type OpenRouterClient struct {
	APIKey         string
	PrimaryModel   string
	FallbackModel  string
	HTTPClient     *http.Client
}

type OpenRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenRouterRequest struct {
	Model    string              `json:"model"`
	Messages []OpenRouterMessage `json:"messages"`
}

type OpenRouterResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

func NewOpenRouterClient(apiKey, primaryModel, fallbackModel string) *OpenRouterClient {
	return &OpenRouterClient{
		APIKey:         apiKey,
		PrimaryModel:   primaryModel,
		FallbackModel:  fallbackModel,
		HTTPClient:     &http.Client{Timeout: 60 * time.Second},
	}
}

func (c *OpenRouterClient) Chat(messages []OpenRouterMessage) (string, error) {
	// Try primary model first
	response, err := c.callAPI(c.PrimaryModel, messages)
	if err != nil {
		// Check if error is due to insufficient credits
		if c.isInsufficientCreditsError(err) && c.FallbackModel != "" {
			fmt.Printf("Primary model failed with insufficient credits, trying fallback model: %s\n", c.FallbackModel)
			// Try fallback model
			response, err = c.callAPI(c.FallbackModel, messages)
			if err != nil {
				return "", fmt.Errorf("fallback model also failed: %w", err)
			}
			return response, nil
		}
		return "", err
	}
	return response, nil
}

func (c *OpenRouterClient) callAPI(model string, messages []OpenRouterMessage) (string, error) {
	reqBody := OpenRouterRequest{
		Model:    model,
		Messages: messages,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "https://coolphy.com")
	req.Header.Set("X-Title", "CoolPhy")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result OpenRouterResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if result.Error != nil {
		return "", fmt.Errorf("API error: %s (code: %d)", result.Error.Message, result.Error.Code)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no response choices returned")
	}

	return result.Choices[0].Message.Content, nil
}

func (c *OpenRouterClient) isInsufficientCreditsError(err error) bool {
	if err == nil {
		return false
	}
	errMsg := err.Error()
	// Check for common insufficient credits error messages
	return contains(errMsg, "insufficient") || 
	       contains(errMsg, "credits") || 
	       contains(errMsg, "quota") ||
	       contains(errMsg, "429") ||
	       contains(errMsg, "rate limit")
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}
