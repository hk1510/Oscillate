const express = require("express")
const router = express.Router()
const fs = require('fs');
const ytdl = require('ytdl-core');


router.get("/:videoid/:time", (req, res) => {
    console.log(req.params)
    ytdl(`https://www.youtube.com/watch?v=${req.params.videoid}&t=${req.params.time}`, {filter: 'audioonly'}).pipe(res)
})

module.exports = router