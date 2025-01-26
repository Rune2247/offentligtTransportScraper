const express = require("express")
const path = require("path")
const db = require("./database/database")
const scrapeData = require("./data/scraper")
const scrapeRejseplanen = require("./data/app/targets/rejseplanen") // Import scrapeRejseplanen
const cron = require("node-cron")
const app = express()
const PORT = 3000

app.use(express.static(path.join(__dirname, "../client")))
app.use(express.json())

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../client/index.html"))
})

app.get("/trips", (req, res) => {
	db.all("SELECT * FROM trips", [], (err, rows) => {
		if (err) {
			res.status(500).json({ error: err.message })
			return
		}
		res.json({ trips: rows })
	})
})

// Schedule the cron job to run every minute
/* cron.schedule("* * * * *", () => {
	scrapeData()
}) */

// Add a new endpoint to run scrapeRejseplanen
app.get("/run", async (req, res) => {
	try {
		await scrapeRejseplanen()
		res.sendStatus(200)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
