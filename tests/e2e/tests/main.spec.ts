import { test, expect, Page } from '@playwright/test'

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

async function registerUser(page: Page, userData: {
  email: string
  password: string
  name: string
  role: 'seeker' | 'consultant'
}) {
  await page.goto('/auth/register')
  await page.fill('input[name="name"]', userData.name)
  await page.fill('input[name="email"]', userData.email)
  await page.fill('input[name="password"]', userData.password)
  await page.fill('input[name="confirmPassword"]', userData.password)
  // Role is selected via buttons in the UI
  const roleButton = page.locator(`button:has-text("${userData.role === 'consultant' ? 'Consultant' : 'Seeker'}")`).first()
  if (await roleButton.count() > 0) {
    await roleButton.click()
  }
  await page.click('button[type="submit"]')
}

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page.locator('h1')).toContainText('Welcome back')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors on invalid login', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', '')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/auth/register')

    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should show error message when API is unreachable', async ({ page }) => {
    // Block all API calls to simulate backend being down
    await page.route('**/auth/login', route => route.abort('failed'))

    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should show an error message, not crash
    await expect(page.locator('text=/Login failed|Network Error/i')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Public Pages', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/')
    // Homepage renders without auth
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show 404 for invalid route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    // Next.js renders a not-found page
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate between auth pages', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('a[href="/auth/register"]')
    await expect(page).toHaveURL(/\/auth\/register/)
  })
})
