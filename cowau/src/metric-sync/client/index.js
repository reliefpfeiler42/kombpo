import * as audio from 'waves-audio';
import ClockSync from './ClockSync';
import SyncScheduler from './SyncScheduler';
import MetricScheduler from './MetricScheduler';

const audioContext = audio.audioContext;
const audioScheduler = audio.getScheduler();

class MetricSync {
	constructor() {

		const clockSync = new ClockSync();
		const syncScheduler = new SyncScheduler(clockSync);
		this._clockSync = clockSync;
		this._syncScheduler = syncScheduler;
		this._metricScheduler = new MetricScheduler(clockSync, syncScheduler);
	}

	// send/recive commands to /from server
	//   sendFunction = (cmd, ...args) => { }
	//   receiveFunction = (cmd, callback) => { }
	// 
	// e.g. for soundworks:
	//   sendFunction = (cmd, ...args) => this.send(cmd, ...args);
	//   receiveFunction = (cmd, callback) => this.receive(cmd, callback);

	start(sendFunction, receiveFunction) {
		const promise = new Promise((resolve, reject) => {
			this._clockSync.start(sendFunction, receiveFunction).then(() => {
				this._syncScheduler.start();
				this._metricScheduler.start(sendFunction, receiveFunction).then(() => resolve());
			});
		});

		return promise;
	}

	resync() {
		return this._clockSync.restart();
	}

	addMetronome(callback, numBeats = 4, metricDiv = 4, tempoScale = 1, startPosition = 0, startOnBeat = false) {
		this._metricScheduler.addMetronome(callback, numBeats, metricDiv, tempoScale, startPosition, startOnBeat);
	}

	removeMetronome(callback) {
		this._metricScheduler.removeMetronome(callback);
	}

	addSyncListener(callback, error = false) {
		this._clockSync.addListener(callback, error);
	}

	removeSyncListener(callback, error = false) {
		this._clockSync.removeListener(callback);    
	}
	
	/**
	 * Difference between the audio scheduler's logical audio time and the `currentTime`
	 * of the audio context.
	 */
	get deltaTime() {
		return audioScheduler.currentTime - audioContext.currentTime;
	}

	get audioTime() {
		return audioScheduler.currentTime;
	}

	getAudioTimeAtSyncTime(syncTime) {
		return this._clockSync.getAudioTimeAtSyncTime(syncTime);
	}

	getAudioTimeAtMetricPosition(metricPosition) {
		const syncTime = this._metricScheduler.getSyncTimeAtMetricPosition(metricPosition);
		return this._clockSync.getAudioTimeAtSyncTime(syncTime);
	}

	get syncTime() {
		return this._clockSync.syncTime;
	}

	getSyncTimeAtAudioTime(audioTime) {
		return this._clockSync.getSyncTimeAtAudioTime(audioTime);
	}

	getSyncTimeAtMetricPosition(metricPosition) {
		return this._metricScheduler.getSyncTimeAtMetricPosition(metricPosition);
	}

	get metricPosition() {
		return this._metricScheduler.position;
	}

	getMetricPositionAtAudioTime(audioTime) {
		const syncTime = this._clockSync.getSyncTimeAtAudioTime(audioTime);
		return this._metricScheduler.getMetricPositionAtSyncTime(syncTime);
	}

	getMetricPositionAtSyncTime(syncTime) {
		return this._metricScheduler.getMetricPositionAtSyncTime(syncTime);
	}

	get tempo() {
		return this._metricScheduler.tempo;
	}

	get tempoUnit() {
		return this._metricScheduler.tempoUnit;
	}

	get audioContext() {
		return audioContext;
	}
}

export default MetricSync;