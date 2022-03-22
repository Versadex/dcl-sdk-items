const identifier = "dcl-cube-0.0.2"; // #VX!-version
const baseURL = "https://api.versadex.xyz";
import { getUserData } from "@decentraland/Identity";

import {
	getCurrentRealm,
	getExplorerConfiguration,
} from "@decentraland/EnvironmentAPI";

export class VersadexImpression {
	public userData = executeTask(async () => {
		// user information & campaign holder
		const data = await getUserData();
		return data;
	});
	public currentRealm = executeTask(async () => {
		// user information & campaign holder
		const data = await getCurrentRealm();
		return data;
	});
	public explorerConfiguration = executeTask(async () => {
		// user information & campaign holder
		const data = await getExplorerConfiguration();
		return data;
	});
	public physicsCast = PhysicsCast.instance;
	public camera = Camera.instance;
	private triggered: Boolean;
	private billboardID: string;
	private campaignID: string;
	private client_identifier: string;
	private billboardTransform: Transform;

	private impressionIdentifier: string;

	private userDistanceFlag: Boolean = false;

	private startTimer: number;
	private endTimer: number;

	constructor(
		billboardID: string,
		campaignID: string,
		billboardTransform: Transform,
		client_identifier: string
	) {
		(this.triggered = false), (this.billboardID = billboardID);
		this.campaignID = campaignID;
		this.billboardTransform = billboardTransform;
		this.client_identifier = client_identifier;
	}

	// proximity measurement
	distance(pos1: Vector3, pos2: Vector3): number {
		const a = pos1.x - pos2.x;
		const b = pos1.z - pos2.z;
		return a * a + b * b;
	}

	// direction measurement
	direction(pos1: Vector3, pos2: Vector3) {
		const a = pos1.x - pos2.x;
		const b = pos1.z - pos2.z;
		const c = pos1.y - pos2.y;
		return new Vector3(a, c, b);
	}

	poorManUuid = () => {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
			/[xy]/g,
			function (c) {
				var r = (Math.random() * 16) | 0,
					v = c == "x" ? r : (r & 0x3) | 0x8;
				return v.toString(16);
			}
		);
	};

	// record view function
	recordView(dist: Number, endTimer: number, impressionIdentifier: string) {
		try {
			// get the user info to send as part of the impression
			executeTask(async () => {
				let view_data = {
					campaign: this.campaignID,
					viewer: (await this.userData).userId,
					distance: dist.toFixed(1),
					duration: endTimer.toFixed(),
					client_identifier: this.client_identifier,
					impression_identifier: impressionIdentifier,
				};

				// post to record impression
				fetch(baseURL + "/c/b/" + this.billboardID + "/m/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Signed": "False",
						"X-Unsigned-Headers": JSON.stringify({
							domain: (await this.currentRealm).domain,
							world_position: Camera.instance.worldPosition,
						}),
					},
					body: JSON.stringify(view_data),
				}).then((response) => response.json());
			});
		} catch {
			log("Could not record impression");
		}
	}

	update() {
		let transform = this.billboardTransform;
		let dist = this.distance(transform.position, this.camera.position);
		let dir = this.direction(transform.position, this.camera.position);
		let camera_readonly = this.physicsCast.getRayFromCamera(1).direction;
		let camera_direction = new Vector3(
			camera_readonly.x,
			camera_readonly.y,
			camera_readonly.z
		);
		let angle = Vector3.GetAngleBetweenVectors(
			dir,
			camera_direction,
			Vector3.Up()
		);

		if (!this.triggered) {
			// if within ~16m or so then record as impressioned/viewed
			if (dist < 300 && Math.abs(angle) < 0.81) {
				if (!this.startTimer) {
					this.startTimer = Date.now();
					this.impressionIdentifier = this.poorManUuid();
				}
				this.userDistanceFlag = true;
			} else if (this.userDistanceFlag && Math.abs(angle) > 0.8) {
				this.endTimer = Date.now() - this.startTimer;
				this.userDistanceFlag = false;
				this.triggered = true;
				this.startTimer = null;
				this.recordView(dist, this.endTimer, this.impressionIdentifier);
			} else {
				null;
			}
		} else if (this.triggered && this.userDistanceFlag == false) {
			this.triggered = false;
		}
	}
}

export type Props = {
	id: string;
	auto_rotate: Boolean;
};

export class VersadexLink extends Entity {
	constructor(position: Vector3, rotation: Quaternion, parent: Entity) {
		super();
		engine.addEntity(this);
		this.setParent(parent);
		this.addComponent(
			new Transform({
				position: position,
				scale: new Vector3(0.25, 0.1, 1),
				rotation: rotation,
			})
		);
		this.addComponent(new PlaneShape());
		// create the paper which always links to versadex
		const seeThrough = new Material();
		seeThrough.albedoColor = new Color4(0, 0, 0, 0);
		this.addComponent(seeThrough);
		this.addComponent(
			new OnPointerDown(() => {
				openExternalURL("https://versadex.xyz");
			})
		);
	}
}

export class VersadexPaper extends Entity {
	constructor(position: Vector3, rotation: Quaternion, parent: Entity) {
		super();
		engine.addEntity(this);
		this.setParent(parent);
		this.addComponent(
			new Transform({
				position: position,
				scale: new Vector3(0.9, 0.9, 1),
				rotation: rotation,
			})
		);
		this.addComponent(new PlaneShape());
	}
}

// Define the system
export class RotateSystem implements ISystem {
	private entity: Entity;
	constructor(entity: Entity) {
		this.entity = entity;
	}

	update() {
		// Iterate over the entities in an component group
		let transform = this.entity.getComponent(Transform);
		transform.rotate(new Vector3(0, 1, 0), 1);
	}
}

export default class VersadexBillboard implements IScript<Props> {
	init() { }

	spawn(host: Entity, props: Props, channel: IChannel) {
		const backboard = new Entity();
		backboard.setParent(host);

		// create material for the back of the billboard
		const backMaterial = new Material();
		backMaterial.albedoColor = Color3.Gray();
		backMaterial.metallic = 0.9;
		backMaterial.roughness = 0.1;

		backboard.addComponent(new GLTFShape("src/dcl-cube/models/cube_billboard.glb")); // #VX!-absolute_path

		if (props.auto_rotate) {
			const rotate = new RotateSystem(host);
			engine.addSystem(rotate);
		}
		const link = new VersadexLink(
			new Vector3(-0.375, -0.5, 0.51),
			Quaternion.Euler(0, 180, 180),
			backboard
		);
		const link2 = new VersadexLink(
			new Vector3(0.375, -0.5, -0.51),
			Quaternion.Euler(0, 0, 180),
			backboard
		);
		const link3 = new VersadexLink(
			new Vector3(0.51, -0.5, 0.375),
			Quaternion.Euler(0, 270, 180),
			backboard
		);
		const link4 = new VersadexLink(
			new Vector3(-0.51, -0.5, -0.375),
			Quaternion.Euler(0, 90, 180),
			backboard
		);

		// create the papers which displays the creative
		const paper = new VersadexPaper(
			new Vector3(0, 0, 0.501),
			Quaternion.Euler(0, 180, 180),
			backboard
		);
		const paper2 = new VersadexPaper(
			new Vector3(0, 0, -0.501),
			Quaternion.Euler(0, 0, 180),
			backboard
		);
		const paper3 = new VersadexPaper(
			new Vector3(+0.501, 0, 0),
			Quaternion.Euler(0, 270, 180),
			backboard
		);
		const paper4 = new VersadexPaper(
			new Vector3(-0.501, 0, 0),
			Quaternion.Euler(0, 90, 180),
			backboard
		);
		const myMaterial = new Material();

		try {
			executeTask(async () => {
				let response = await fetch(baseURL + "/c/b/" + props.id + "/gc/");
				let json = await response.json();
				const myTexture = new Texture(json.image_url, { wrap: 1 });
				myMaterial.albedoTexture = myTexture;
				for (let item of [paper, paper2, paper3, paper4]) {
					item.addComponent(myMaterial);
					item.addComponent(
						new OnPointerDown(() => {
							openExternalURL(json.landing_url);
						})
					);
				}
				// set campaign ID
				const billboardTransform = host.getComponent(Transform);
				const impression = new VersadexImpression(
					props.id,
					json.id,
					billboardTransform,
					identifier
				);
				engine.addSystem(impression);
			});
		} catch {
			log("failed to reach URL");
		}
	}
}
