from playwright.sync_api import sync_playwright

def verify_ux(page):
    # Navigate to root (auto login via mock)
    page.goto("http://localhost:3000/")

    print("Navigated to root")

    # Wait for Studio Page
    try:
        # Wait for something that is definitely on the studio page
        page.wait_for_selector('text=AI Video Generator', timeout=20000)
        print("Studio loaded")
    except Exception as e:
        print("Studio load failed")
        page.screenshot(path="verification/error_studio.png")
        raise e

    # 3. Verify Velvet Disclaimer
    # Toggle Velvet Mode
    print("Toggling velvet mode")
    try:
        # Wait for overlay to be gone
        page.wait_for_timeout(1000)
        page.click('#sidebar-mode-toggle')
        # Wait for toast
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/verification_velvet.png")
        print("Screenshot velvet taken")
    except Exception as e:
        print(f"Velvet toggle failed: {e}")
        page.screenshot(path="verification/error_velvet.png")


    # Switch back if needed
    try:
        if page.is_visible('#sidebar-mode-toggle'):
             page.click('#sidebar-mode-toggle')
             page.wait_for_timeout(500)
    except:
        pass

    # 4. Verify Talent Page DNA field
    print("Checking Talent Page")
    try:
        # Use updated path
        page.click('a[href="/app/talent"]')

        page.wait_for_selector('text=New Persona', timeout=10000)
        page.click('text=New Persona')
        # Check if "DNA / Notes" textarea exists
        if page.is_visible('textarea[placeholder*="neck tattoo"]'):
            print("DNA/Notes field found")
        else:
            print("DNA/Notes field NOT found")

        page.screenshot(path="verification/verification_talent.png")
    except Exception as e:
         print(f"Talent check failed: {e}")
         page.screenshot(path="verification/error_talent.png")

    # 5. Verify Checkout Modal Terms
    print("Checking Checkout Modal")
    try:
        # Open billing
        page.click('a[href="/app/billing"]')

        # Click a plan to open modal. "ELEGIR PLAN"
        page.wait_for_selector('text=ELEGIR PLAN')
        page.click('text=ELEGIR PLAN >> nth=0')
        page.wait_for_selector('text=Checkout')

        # Open details
        page.click('summary:has-text("Terms & Conditions")')
        page.wait_for_selector('text=Recurring subscription')

        page.screenshot(path="verification/verification_checkout.png")
    except Exception as e:
         print(f"Checkout check failed: {e}")
         page.screenshot(path="verification/error_checkout.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800}) # Large screen
        page = context.new_page()
        # Pre-set local storage to avoid onboarding
        page.add_init_script("localStorage.setItem('hasSeenStudioOnboarding_v1', 'true')")

        try:
            verify_ux(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
