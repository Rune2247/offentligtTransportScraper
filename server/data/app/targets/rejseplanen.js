const puppeteer = require("puppeteer")
const fs = require("fs")
const path = require("path")

// Function to get browser launch options
function getBrowserOptions() {
	return {
		headless: false,
		args: [`--window-size=1280,800`],
		defaultViewport: {
			width: 1280,
			height: 800
		}
	}
}

async function scrapeRejseplanen() {
	console.log("scrapeRejseplanen started.")

	// Ensure screenshots directory exists
	const screenshotsDir = path.join(__dirname, "screenshots")
	if (!fs.existsSync(screenshotsDir)) {
		fs.mkdirSync(screenshotsDir)
		console.log("Screenshots directory created.")
	}

	const browser = await puppeteer.launch(getBrowserOptions())
	console.log("Browser launched with custom settings.")
	const page = await browser.newPage()

	// Set a custom User-Agent to mimic a real browser
	await page.setUserAgent(
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
			"AppleWebKit/537.36 (KHTML, like Gecko) " +
			"Chrome/112.0.0.0 Safari/537.36"
	)
	console.log("Custom User-Agent set.")

	// Enable request interception
	await page.setRequestInterception(true)
	console.log("Request interception enabled.")

	// Modify request interception to allow 'Hafas' scripts
	page.on("request", (request) => {
		const resourceType = request.resourceType()
		const url = request.url()
		/* if (resourceType === "script" && !url.includes("hafas")) {
			request.abort()
		} else */ if (resourceType === "stylesheet") {
			request.abort()
		} else {
			request.continue()
		}
	})
	console.log("Blocked scripts and styles.")

	await page.goto("https://www.rejseplanen.dk/webapp/", {
		waitUntil: "networkidle2"
	})
	console.log("Navigated to rejseplanen.dk and network is idle.")

	// Check for the presence of the optional button and click if it exists
	const optionalButton = await page.$(".hfs_btn.hfs_btnDefault.hfs_btnBlock")
	if (optionalButton) {
		await optionalButton.click()
		console.log("Optional button clicked.")
	} else {
		console.log("Optional button not found.")
	}

	// Wait for a specific selector that confirms the page has loaded desired content
	await page.waitForSelector(".from", { timeout: 10000 })
	await page.waitForSelector(".to", { timeout: 10000 })

	console.log("Desired element is loaded on the page.")

	// Interact with the #From element
	await page.waitForSelector("#From")
	console.log("Selector #From found.")
	await page.click("#From")
	// After typing into #From, press Enter to select the first suggestion
	await page.type("#From", "Århus H")
	console.log("Typed 'Århus H' into #From.")
	await page.keyboard.press("Enter")
	console.log("Pressed Enter to select the first suggestion in From.")
	await page.screenshot({
		path: path.join(screenshotsDir, "screenshot1.png"),
		fullPage: true
	})

	// Interact with the #To element
	await page.waitForSelector("#To")
	console.log("Selector #To found.")
	await page.click("#To")
	// After typing into #To, press Enter to select the first suggestion
	await page.type("#To", "København H")
	console.log("Typed 'København H' into #To.")
	await page.keyboard.press("Enter")
	console.log("Pressed Enter to select the first suggestion in To.")
	await page.screenshot({
		path: path.join(screenshotsDir, "screenshot2.png"),
		fullPage: true
	})

	// Replace the search button click with Promise.all to handle click and navigation
	/* 	const findButton = await page.$('[name="submitTPForm"]')
	if (findButton) {
		await Promise.all([
			findButton.click(),
			page.waitForNavigation({ waitUntil: 'networkidle2' })
		])
		console.log("Find button clicked and navigation awaited.")
	} else {
		console.log("Find button not found.")
	} */

	// Add a 5-second delay using setTimeout as a fallback for waitForTimeout
	await new Promise((resolve) => setTimeout(resolve, 5000))
	await page.waitForSelector(".hfs_itemResultsConnectionOverviewLine", {
		timeout: 10000
	})

	console.log("Navigation complete.")
	await page.screenshot({
		path: path.join(screenshotsDir, "screenshot3.png"),
		fullPage: true
	})

	// Find all .hfs_itemResultsConnectionOverviewLine elements and save as JSON
	const connections = await page.$$eval('.hfs_itemResultsConnectionOverviewLine', elements =>
		elements.map(el => el.innerText.trim())
	)

	fs.writeFileSync(path.join(screenshotsDir, 'connections.json'), JSON.stringify(connections, null, 2))
	console.log("Connections data saved as JSON.")

	// Add a full-page screenshot
	await page.screenshot({
		path: path.join(screenshotsDir, "screenshot4.png"),
		fullPage: true
	})
	console.log("Full page screenshot taken.")

	await browser.close()
	console.log("Browser closed.")
} // Added missing closing brace for the scrapeRejseplanen function

// Export the function
module.exports = scrapeRejseplanen
