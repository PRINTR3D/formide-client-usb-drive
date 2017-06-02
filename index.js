'use strict'

const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')
const api = require('./api')
const usb = require('./usb')

class UsbDrives extends Plugin {
	
	constructor (client) {
		super(client, pkg)
	}
	
	getApi (router) {
		return api(this, router)
	}
	
	/**
	 * List USB drives
	 */
	getDrives () {
		return new Promise((resolve, reject) => {
			usb.drives((err, drives) => {
				if (err) return reject(err)
				return resolve(drives.split('\n'))
			})
		})
	}
	
	/**
	 * Mount USB drive
	 * @param {*} drive 
	 */
	mountDrive (drive) {
		return new Promise((resolve, reject) => {
			usb.mount(drive, (err, result) => {
				if (err) return reject(err)
				return resolve({
					message: 'drive mounted'
				})
			})
		})
	}
	
	/**
	 * Unmount USB drive
	 * @param {*} drive 
	 */
	unmountDrive (drive) {
		return new Promise((resolve, reject) => {
			usb.drives(drive, (err, result) => {
				if (err) return reject(err)
				return resolve({
					message: 'drive unmounted'
				})
			})
		})
	}
	
	/**
	 * Read drive on relative path
	 * @param {*} drive 
	 * @param {*} path 
	 */
	readDrive (drive, path) {
		return new Promise((resolve, reject) => {
			usb.read(drive, path, (err, files) => {
				if (err) return reject(err)

				files = files.split('\n')
				let output = []

				// get name, size and type from file list
				for (let i = 0; i < files.length; i++) {

					// get file details
					let file = files[i].replace(/ +(?= )/g, '').split(' ')
					let name = file[8]

					if (!name) continue;

					// filter
					if (file.length > 9) {
						name = file.splice(8, file.length - 1).join(' ')
					}

					// determine if file or dir
					const fileType = (name.charAt(name.length - 1) === '/') ? 'dir' : 'file'

					// strip away * from file name (because of -F)
					if (name.charAt(name.length - 1) === '*') {
						name = name.slice(0, -1)
					}

					// add to result if folder or gcode
					if (file.length >= 8 && (name.indexOf('.gcode') > -1 || fileType === 'dir')) {
						output.push({
							name: name,
							size: file[4],
							type: fileType
						})
					}
				}

				return resolve(output)
			})
		})
	}
	
	/**
	 * Copy file from USB drive to local storage
	 * @param {*} drive 
	 * @param {*} path 
	 */
	copyFile (drive, filePath) {
		const self = this
		return new Promise((resolve, reject) => {

			// find full file path
			const fullFilePath = path.resolve('/run/media', drive, filePath)
			console.log('fullFilePath', fullFilePath)
			
			// check if exits
			if (!fs.existsSync(fullFilePath)) return reject(new Error('File not found'))

			// create read stream
			const readStream = fs.createReadStream(fullFilePath)

			// get base name
			const filename = path.basename(filePath)

			// call storage module to transfer file
			self._client.storage.write(filename, readStream).then((stats) => {
				return resolve(stats)
			}).catch((err) => {
				return reject(err)
			})
		})
	}
}

module.exports = UsbDrives
