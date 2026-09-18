package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type PayPalProvider struct {
	ClientID     string
	ClientSecret string
	Mode         string // "sandbox" or "live"
	BaseURL      string
	AccessToken  string
	TokenExpiry  time.Time
}

func NewPayPalProvider(clientID, clientSecret, mode string) *PayPalProvider {
	baseURL := "https://api-m.sandbox.paypal.com"
	if mode == "live" {
		baseURL = "https://api-m.paypal.com"
	}

	return &PayPalProvider{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Mode:         mode,
		BaseURL:      baseURL,
	}
}

// GetAccessToken obtains OAuth2 access token from PayPal
func (p *PayPalProvider) GetAccessToken(ctx context.Context) error {
	// Check if token is still valid
	if p.AccessToken != "" && time.Now().Before(p.TokenExpiry) {
		return nil
	}

	url := p.BaseURL + "/v1/oauth2/token"

	reqBody := "grant_type=client_credentials"
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBufferString(reqBody))
	if err != nil {
		return err
	}

	req.SetBasicAuth(p.ClientID, p.ClientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("paypal auth failed: %s", string(body))
	}

	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	p.AccessToken = result.AccessToken
	p.TokenExpiry = time.Now().Add(time.Duration(result.ExpiresIn - 60) * time.Second)

	return nil
}

// CreateOrder creates a PayPal order (payment)
func (p *PayPalProvider) CreateOrder(ctx context.Context, amount float64, currency string, description string, returnURL string, cancelURL string) (*PayPalOrderResult, error) {
	if err := p.GetAccessToken(ctx); err != nil {
		return nil, err
	}

	url := p.BaseURL + "/v2/checkout/orders"

	orderReq := PayPalOrderRequest{
		Intent: "CAPTURE",
		PurchaseUnits: []PayPalPurchaseUnit{
			{
				Amount: PayPalAmount{
					CurrencyCode: currency,
					Value:        fmt.Sprintf("%.2f", amount),
				},
				Description: description,
			},
		},
		ApplicationContext: PayPalApplicationContext{
			ReturnURL: returnURL,
			CancelURL: cancelURL,
		},
	}

	body, err := json.Marshal(orderReq)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("paypal order creation failed: %s", string(respBody))
	}

	var result PayPalOrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Extract approval URL
	var approvalURL string
	for _, link := range result.Links {
		if link.Rel == "approve" {
			approvalURL = link.Href
			break
		}
	}

	return &PayPalOrderResult{
		ID:           result.ID,
		Status:       result.Status,
		ApprovalURL:  approvalURL,
		Amount:       amount,
		Currency:     currency,
	}, nil
}

// CaptureOrder captures an approved PayPal order
func (p *PayPalProvider) CaptureOrder(ctx context.Context, orderID string) (*PayPalOrderResult, error) {
	if err := p.GetAccessToken(ctx); err != nil {
		return nil, err
	}

	url := p.BaseURL + "/v2/checkout/orders/" + orderID + "/capture"

	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("paypal capture failed: %s", string(respBody))
	}

	var result PayPalOrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Extract capture details
	var captureID string
	var captureStatus string
	if len(result.PurchaseUnits) > 0 && len(result.PurchaseUnits[0].Payments.Captures) > 0 {
		captureID = result.PurchaseUnits[0].Payments.Captures[0].ID
		captureStatus = result.PurchaseUnits[0].Payments.Captures[0].Status
	}

	return &PayPalOrderResult{
		ID:           result.ID,
		Status:       result.Status,
		CaptureID:    captureID,
		CaptureStatus: captureStatus,
	}, nil
}

// CreateSubscription creates a PayPal subscription plan and subscription
func (p *PayPalProvider) CreatePlan(ctx context.Context, name string, description string, amount float64, currency string, interval string, intervalCount int) (*PayPalPlanResult, error) {
	if err := p.GetAccessToken(ctx); err != nil {
		return nil, err
	}

	// Create billing plan
	url := p.BaseURL + "/v1/billing/plans"

	frequency := "MONTHLY"
	if interval == "day" {
		frequency = "DAILY"
	} else if interval == "week" {
		frequency = "WEEKLY"
	} else if interval == "year" {
		frequency = "YEARLY"
	}

	planReq := PayPalPlanRequest{
		Name:        name,
		Description: description,
		Type:        "SERVICE",
		PaymentDefinitions: []PayPalPaymentDefinition{
			{
				Name:         "Regular payments",
				Type:         "REGULAR",
				Frequency:    frequency,
				FrequencyCount: intervalCount,
				Amount: PayPalAmount{
					CurrencyCode: currency,
					Value:        fmt.Sprintf("%.2f", amount),
				},
				Cycles: "0", // infinite cycles
			},
		},
	}

	body, err := json.Marshal(planReq)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("paypal plan creation failed: %s", string(respBody))
	}

	var result PayPalPlanResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &PayPalPlanResult{
		ID:          result.ID,
		Name:        result.Name,
		Description: result.Description,
		Status:      result.Status,
	}, nil
}

// RefundCapture refunds a PayPal capture
func (p *PayPalProvider) RefundCapture(ctx context.Context, captureID string, amount float64, currency string, reason string) (*PayPalRefundResult, error) {
	if err := p.GetAccessToken(ctx); err != nil {
		return nil, err
	}

	url := p.BaseURL + "/v2/payments/captures/" + captureID + "/refund"

	refundReq := PayPalRefundRequest{
		Amount: PayPalAmount{
			CurrencyCode: currency,
			Value:        fmt.Sprintf("%.2f", amount),
		},
		Note: reason,
	}

	body, err := json.Marshal(refundReq)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(body))
	if err != err {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("paypal refund failed: %s", string(respBody))
	}

	var result PayPalRefundResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &PayPalRefundResult{
		ID:     result.ID,
		Status: result.Status,
		Amount: amount,
	}, nil
}

// GetOrder retrieves order details
func (p *PayPalProvider) GetOrder(ctx context.Context, orderID string) (*PayPalOrderResult, error) {
	if err := p.GetAccessToken(ctx); err != nil {
		return nil, err
	}

	url := p.BaseURL + "/v2/checkout/orders/" + orderID

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.AccessToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result PayPalOrderResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &PayPalOrderResult{
		ID:     result.ID,
		Status: result.Status,
	}, nil
}

// Request/Response types
type PayPalOrderRequest struct {
	Intent           string              `json:"intent"`
	PurchaseUnits    []PayPalPurchaseUnit `json:"purchase_units"`
	ApplicationContext PayPalApplicationContext `json:"application_context"`
}

type PayPalPurchaseUnit struct {
	Amount      PayPalAmount `json:"amount"`
	Description string       `json:"description"`
}

type PayPalAmount struct {
	CurrencyCode string `json:"currency_code"`
	Value        string `json:"value"`
}

type PayPalApplicationContext struct {
	ReturnURL string `json:"return_url"`
	CancelURL string `json:"cancel_url"`
}

type PayPalOrderResponse struct {
	ID            string             `json:"id"`
	Status        string             `json:"status"`
	Links         []PayPalLink       `json:"links"`
	PurchaseUnits []PayPalPurchaseUnitResponse `json:"purchase_units"`
}

type PayPalPurchaseUnitResponse struct {
	Payments PayPalPayments `json:"payments"`
}

type PayPalPayments struct {
	Captures []PayPalCapture `json:"captures"`
}

type PayPalCapture struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type PayPalLink struct {
	Href   string `json:"href"`
	Rel    string `json:"rel"`
	Method string `json:"method"`
}

type PayPalPlanRequest struct {
	Name              string                   `json:"name"`
	Description       string                   `json:"description"`
	Type              string                   `json:"type"`
	PaymentDefinitions []PayPalPaymentDefinition `json:"payment_definitions"`
}

type PayPalPaymentDefinition struct {
	Name            string       `json:"name"`
	Type            string       `json:"type"`
	Frequency       string       `json:"frequency"`
	FrequencyCount  int          `json:"frequency_interval"`
	Amount          PayPalAmount `json:"amount"`
	Cycles          string       `json:"cycles"`
}

type PayPalPlanResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type PayPalRefundRequest struct {
	Amount PayPalAmount `json:"amount"`
	Note   string       `json:"note_to_payer"`
}

type PayPalRefundResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

// Result types
type PayPalOrderResult struct {
	ID            string
	Status        string
	ApprovalURL   string
	CaptureID     string
	CaptureStatus string
	Amount        float64
	Currency      string
}

type PayPalPlanResult struct {
	ID          string
	Name        string
	Description string
	Status      string
}

type PayPalRefundResult struct {
	ID     string
	Status string
	Amount float64
}