'use strict'

const exec = require('child_process').exec
const fusb = 'sudo fusb' // custom script running on The Element
const fs = require('fs')
const path = require('path')

module.exports = {
	
	/**
	 * List available USB drives
	 * @param callback
	 */
	drives (callback) {
		exec(`${fusb} drives`, (err, stdout) => {
			if (err) return callback(err)
			return callback(null, stdout.trim())
		})
	},
	
	/**
	 * Mount a USB drive
	 * @param drive
	 * @param callback
	 */
	mount (drive, callback) {
		exec(`${fusb} mount ${drive}`, (err, stdout, stderr) => {
			if (err || stderr) return callback(err || stderr)
			return callback(null, stdout)
		})
	},
	
	/**
	 * Unmount a USB drive
	 * @param drive
	 * @param callback
	 */
	unmount (drive, callback) {
		exec(`${fusb} unmount ${drive}`, (err, stdout, stderr) => {
			if (err) return callback(err || stderr)
			return callback(null, stdout)
		})
	},
	
	/**
	 * List files on USB drive in path
	 * @param drive
	 * @param path
	 * @param callback
	 */
	read (drive, filePath, callback) {

		// filter out spaces and too many slashes
		filePath = path.normalize(filePath.replace(/ /g, '\\ '))

		exec(`${fusb} read ${drive} ${filePath}`, (err, stdout) => {
			if (err) return callback(err)
			return callback(null, stdout.trim())
		})
	}
}