
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_sold_items(page: Page):
    # 1. Arrange: Go to the test page.
    print("Navigating to test page...")
    page.goto("http://localhost:5173/test-videocard")

    # Wait for page to load
    page.wait_for_timeout(3000)

    # 2. Check Sold Item (Owner)
    print("Checking Sold Item (Owner)...")
    sold_card = page.locator("#card-sold-owner")

    # Expect SOLD badge
    expect(sold_card.get_by_text("SOLD", exact=True).first).to_be_visible()

    # Expect NO Remix button
    # Remix button has title="Remix"
    expect(sold_card.locator("button[title='Remix']")).not_to_be_visible()

    # Expect NO Publish button
    expect(sold_card.locator("button[title='Publish']")).not_to_be_visible()

    # Expect View Details (Eye icon) - checked via title
    expect(sold_card.locator("button[title='View Details']")).to_be_visible()

    # 3. Check For Sale Item (Owner)
    print("Checking For Sale Item (Owner)...")
    sale_card = page.locator("#card-forsale-owner")

    # Expect Locked (so NO Remix/Publish) because owner+forsale = locked?
    # Logic: isLocked = isSold || (isForSale && !isOwner)
    # Wait, if I am owner and it IS for sale.
    # isLocked = false || (true && false) = false.
    # So it is NOT locked.
    # BUT: showRemix = !isLocked && ... && !isForSale.
    # Since isForSale is true, showRemix should be FALSE.
    expect(sale_card.locator("button[title='Remix']")).not_to_be_visible()

    # showPublish = !isLocked && ... && !isForSale.
    # Since isForSale is true, showPublish should be FALSE.
    expect(sale_card.locator("button[title='Publish']")).not_to_be_visible()

    # showManage = !isLocked && isForSale.
    # !false && true = true. Should be visible.
    expect(sale_card.locator("button[title='Manage Listing']")).to_be_visible()

    # 4. Check Sold Item (Public)
    print("Checking Sold Item (Public)...")
    sold_pub = page.locator("#card-sold-public")
    expect(sold_pub.get_by_text("SOLD", exact=True).first).to_be_visible()
    expect(sold_pub.locator("button[title='Remix']")).not_to_be_visible()

    # 5. Take Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_sold_items(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
