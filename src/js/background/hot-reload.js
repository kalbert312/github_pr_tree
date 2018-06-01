// From https://github.com/xpl/crx-hotreload

const filesInDirectory = dir => new Promise(resolve =>
    dir.createReader().readEntries(entries =>
        Promise.all(entries.filter(e => e.name[0] !== '.').map(e =>
            e.isDirectory
                ? filesInDirectory(e)
                : new Promise(resolve => e.file(resolve))
        ))
            .then(files => [].concat(...files))
            .then(resolve)
    )
)

const timestampForFilesInDirectory = dir =>
    filesInDirectory(dir).then(files =>
        files.map(f => f.name + f.lastModifiedDate).join())

const reload = () => {
    // Currently, this refreshes only the currently active tab in Chrome
    // But it would be possible to refresh all of the tabs that match the desired host (e.g. public or hosted github)
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]) { chrome.tabs.reload(tabs[0].id) }
        chrome.runtime.reload()
    })
}

const watchChanges = (dir, lastTimestamp) => {
    timestampForFilesInDirectory(dir).then(timestamp => {
        if (!lastTimestamp || (lastTimestamp === timestamp)) {
            setTimeout(() => watchChanges(dir, timestamp), 1000) // retry after 1s
        } else {
            reload()
        }
    })

}

chrome.management.getSelf(self => {
    if (self.installType === 'development') {
        chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir))
    }
})