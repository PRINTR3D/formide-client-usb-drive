'use strict'

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

					// filter
					if (file.length > 9) {
						name = file.splice(8, file.length - 1).join(' ')
					}

					// check if file or dir (with -F)
					if (file.length >= 8) {
						output.push({
							name: name,
							size: file[4],
							type: (name.charAt(name.length - 1) === '/') ? 'dir' : 'file'
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
			const readStream = usb.readFile(drive, filePath)
			const filename = path.basename(filePath)
			self._client.storage.write(filename, readStream).then((stats) => {
				return resolve(stats)
			}).catch((err) => {
				return reject(err)
			})
		})
	}
}

module.exports = UsbDrives
