
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Check Landing Page
    try:
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="verification/landing_page.png")
        print("Landing page screenshot taken.")
    except Exception as e:
        print(f"Error checking landing page: {e}")

    # Check Title
    title = page.title()
    print(f"Page Title: {title}")

    # Check for text "MivideoAI"
    content = page.content()
    if "MivideoAI" in content:
        print("MivideoAI found in content.")
    else:
        print("MivideoAI NOT found in content.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
