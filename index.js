'use strict'

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
	
	getDrives () {
		return new Promise((resolve, reject) => {
			usb.drives((err, drives) => {
				if (err) return reject(err)
				return resolve(drives.split('\n'))
			})
		})
	}
	
	mountDrive (drive) {
		return new Promise((resolve, reject) => {
			usb.mount(drive, (err, result) => {
				if (err) return reject(err)
				return resolve(result)
			})
		})
	}
	
	unmountDrive (drive) {
		return new Promise((resolve, reject) => {
			usb.drives(drive, (err, result) => {
				if (err) return reject(err)
				return resolve(result)
			})
		})
	}
	
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
	
	copyFile (drive, path) {
		const self = this
		return new Promise((resolve, reject) => {
			const readStream = usb.readFile(drive, path)
			self._client.storage.write(path, readStream).then((stats) => {
				return resolve(stats)
			}).catch((err) => {
				return reject(err)
			})
		})
	}
}

module.exports = UsbDrives
