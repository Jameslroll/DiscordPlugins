/**
 * @name DistinctFolders
 * @author jameslroll
 * @description Emphasizes guildes within a folder from other folders.
 * @version 0.0.1
 */

module.exports = class DistinctFolders {
	constructor(meta) {
		for (let key in meta)
			this[key] = meta[key];
	}

	log() {
		console.log(`%c[${this.name}]`, "color: green", ...arguments);
	}

	mutate(mutations, observer) {
		for (const mutation of mutations) {
			if (mutation.type === "childList")
			{
				if (this.isWrapperNode(mutation.target))
					setTimeout(() => this.updateFolderNode(mutation.target), 0);
				else if (mutation.addedNodes != null)
					for (const addedNode of mutation.addedNodes)
						if (this.isWrapperNode(addedNode))
							this.updateFolderNode(addedNode);
			}

			if (
				mutation.type === "attributes" &&
				mutation.target instanceof SVGElement &&
				mutation.attributeName === "style"
			)
			{
				const folderNode = this.findFolderNode(mutation.target);
				if (folderNode != null)
					this.updateFolderNode(folderNode);
			}
		}
	}

	findFolderNode(node) {
		let foundGuild = false;

		while (node != null && (!foundGuild || !this.isWrapperNode(node)))
		{
			if (!foundGuild)
				foundGuild = this.isListNode(node);

			node = node.parentNode;
		}

		return node;
	}

	updateFolderNode(node) {
		const svgNode = node.querySelector("svg[role='img']");
		const background = node.querySelector("span[class^='expandedFolderBackground-']");

		if (svgNode == null || background == null) return;

		const color = svgNode.style.color ?? "transparent";

		background.style.backgroundColor = color;
		background.style.opacity = 0.5;
	}

	resetFolderNode(node) {
		const background = node.querySelector("span[class^='expandedFolderBackground-']");
		if (background == null) return;

		background.style.backgroundColor = null;
	}

	isWrapperNode(node) {
		return typeof node.className === "string" && node.className.startsWith("wrapper-");
	}

	isListNode(node) {
		return typeof node.className === "string" && node.className.startsWith("listItem-");
	}

	initServers(node) {
		for (const child of node.childNodes)
			if (this.isWrapperNode(child))
				this.updateFolderNode(child);

		const observer = new MutationObserver((mutations, observer) => this.mutate(mutations, observer));
		
		observer.observe(node, {
			childList: true,
			subtree: true,
			attributes: true,
		})

		if (this.observer != null)
			this.observer.disconnect();

		this.observer = observer;
	}

	getServersNode() {
		return document.querySelector("div[aria-label='Servers']");
	}

	start() {
		this.log("Starting...");

		// Create the node immediately.
		let serversNode = this.getServersNode();
		this.initServers(serversNode);

		// Interval created once as script starts to make sure the node
		// wasn't deleted (e.g.) guild nodes remount as the settings are
		// opened and closed, or other window.
		this.interval = setInterval(() => {
			// Waits while the node is mounted.
			if (document.body.contains(serversNode)) return;

			// Wait until the node doesn't exist.
			serversNode = this.getServersNode();
			if (serversNode == null) return;

			// Re-initialize.
			this.log("Servers node was destroyed: reinitializing")
			this.initServers(serversNode);
		}, 3000)
	}

	stop() {
		this.log("Stopping...");

		// Remove the observer.
		this.observer.disconnect();
		this.observer = null;

		// Stop the interval.
		if (this.interval)
		{
			clearInterval(this.interval);
			this.interval = null;
		}

		// Remove created nodes.
		const serversNode = this.getServersNode();

		for (const child of serversNode.childNodes)
			if (this.isWrapperNode(child))
				this.resetFolderNode(child);
	}
}
