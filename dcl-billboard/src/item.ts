const identifier = "dcl-billboard-0.0.7"; // #VX!-version
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
		return data!;
	});
	public currentRealm = executeTask(async () => {
		// user information & campaign holder
		const data = await getCurrentRealm();
		return data!;
	});
	public explorerConfiguration = executeTask(async () => {
		// user information & campaign holder
		const data = await getExplorerConfiguration();
		return data!;
	});
	public physicsCast = PhysicsCast.instance;
	public camera = Camera.instance;
	private billboardID: string;
	private campaignID: string;
	private client_identifier: string;
	private billboardTransform: Transform;

	private impressionIdentifier: string;

	private userDistanceFlag: Boolean = false;
	private raycastNotLookingAtSI: Boolean = true;
	private raycastEntityValidation: Boolean = false;

	private startTimer!: number;
	private endTimer!: number;

	constructor(
		billboardID: string,
		campaignID: string,
		billboardTransform: Transform,
		client_identifier: string,
		impression_identifier: string
	) {
		this.billboardID = billboardID;
		this.campaignID = campaignID;
		this.billboardTransform = billboardTransform;
		this.client_identifier = client_identifier;
		this.impressionIdentifier = impression_identifier;
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

	// record view function
	recordView(dist: Number, endTimer: number, impressionIdentifier: string) {
		try {
			// get the user info to send as part of the impression
			executeTask(async () => {
				let view_data = {
					viewer: (await this.userData).userId,
					distance: dist.toFixed(1),
					duration: endTimer.toFixed(),
					impression: impressionIdentifier,
				};

				// post to record impression
				fetch(baseURL + "/c/u/" + this.billboardID + "/m/", {
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
		let camera_readonly = this.physicsCast.getRayFromCamera(100).direction;
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
		let cameraLookDirection = Vector3.Forward().rotate(this.camera.rotation);

		//Upper rays
		let modDirection1 = new Vector3(0, 0.15, 1).rotate(this.camera.rotation);
		let modDirection2 = new Vector3(0.1, 0.1, 1).rotate(this.camera.rotation);
		let modDirection3 = new Vector3(-0.1, 0.1, 1).rotate(this.camera.rotation);

		//Lower rays
		let modDirection4 = new Vector3(-0.1, -0.1, 1).rotate(this.camera.rotation);
		let modDirection5 = new Vector3(0.1, -0.1, 1).rotate(this.camera.rotation);
		let modDirection6 = new Vector3(0, -0.15, 1).rotate(this.camera.rotation);

		//Mid rays
		let modDirection7 = new Vector3(-0.15, 0, 1).rotate(this.camera.rotation);
		let modDirection8 = new Vector3(0.15, 0, 1).rotate(this.camera.rotation);

		let rayCenter: Ray = {
			origin: this.camera.position,
			direction: cameraLookDirection,
			distance: 2000,
		};

		let rayMod1: Ray = {
			origin: this.camera.position,
			direction: modDirection1,
			distance: 2000,
		};
		let rayMod2: Ray = {
			origin: this.camera.position,
			direction: modDirection2,
			distance: 2000,
		};
		let rayMod3: Ray = {
			origin: this.camera.position,
			direction: modDirection3,
			distance: 2000,
		};

		let rayMod4: Ray = {
			origin: this.camera.position,
			direction: modDirection4,
			distance: 2000,
		};

		let rayMod5: Ray = {
			origin: this.camera.position,
			direction: modDirection5,
			distance: 2000,
		};

		let rayMod6: Ray = {
			origin: this.camera.position,
			direction: modDirection6,
			distance: 2000,
		};

		let rayMod7: Ray = {
			origin: this.camera.position,
			direction: modDirection7,
			distance: 2000,
		};

		let rayMod8: Ray = {
			origin: this.camera.position,
			direction: modDirection8,
			distance: 2000,
		};

		this.physicsCast.hitFirst(
			rayCenter,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			0
		);

		this.physicsCast.hitFirst(
			rayMod1,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			1
		);

		this.physicsCast.hitFirst(
			rayMod2,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			2
		);

		this.physicsCast.hitFirst(
			rayMod3,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			3
		);

		this.physicsCast.hitFirst(
			rayMod4,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			4
		);

		this.physicsCast.hitFirst(
			rayMod5,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			5
		);

		this.physicsCast.hitFirst(
			rayMod6,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			6
		);

		this.physicsCast.hitFirst(
			rayMod7,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			7
		);

		this.physicsCast.hitFirst(
			rayMod8,
			(raycastHitEntity) => {
				if (
					raycastHitEntity.entity.meshName == "versadexSmartItem_collider" &&
					this.raycastNotLookingAtSI
				) {
					this.raycastNotLookingAtSI = false;
					this.raycastEntityValidation = true;
				}
			},
			8
		);

			if (!this.raycastNotLookingAtSI) {
				if (
					dist < 2000 &&
					Math.abs(angle) < 0.81 &&
					this.raycastEntityValidation
				) {
					if (!this.startTimer) {
						this.startTimer = Date.now();
					}
					this.userDistanceFlag = true;
				} else if (this.userDistanceFlag && Math.abs(angle) > 0.8) {
					this.endTimer = Date.now() - this.startTimer;
					this.userDistanceFlag = false;
					this.raycastNotLookingAtSI = true;
					this.raycastEntityValidation = false;
					this.startTimer = 0;
					this.recordView(dist, this.endTimer, this.impressionIdentifier);
				} else {
					null;
				}
			}
		};
	}
	// chris@versadex.xyz
}

import { getUserData as getUserDataForImpression } from "@decentraland/Identity";

export type Props = {
	id: string;
};

export default class VersadexSmartItem implements IScript<Props> {
	init() {}

	public userData = executeTask(async () => {
		// user information & campaign holder
		const data = await getUserDataForImpression();
		return data!;
	});

	spawn(host: Entity, props: Props, channel: IChannel) {
		const backboard = new Entity();
		backboard.setParent(host);

		const backboardTransform = host.getComponent(Transform);

		// Taken from blender file of the model
		enum BackBoardDimensions {
			dimensionX = 1000,
			dimensionY = 1000,
			dimensionZ = 20,
		}

		enum ChangedBackboardTransform {
			dimensionX = BackBoardDimensions.dimensionX * backboardTransform.scale.x,
			dimensionY = BackBoardDimensions.dimensionY * backboardTransform.scale.y,
			dimensionZ = BackBoardDimensions.dimensionZ * backboardTransform.scale.z,
		}

		// create material for the back of the billboard
		const backMaterial = new Material();
		backMaterial.albedoColor = Color3.Gray();
		backMaterial.metallic = 0.9;
		backMaterial.roughness = 0.1;

		backboard.addComponent(new GLTFShape("src/dcl-billboard/models/billboard.glb")); // #VX!-absolute_path

		// create the paper which always links to versadex
		const versadex_link = new Entity();
		versadex_link.setParent(backboard);
		versadex_link.addComponent(
			new Transform({
				position: new Vector3(-0.86, -0.5, 0.0501),
				scale: new Vector3(0.25, 0.1, 1),
				rotation: Quaternion.Euler(0, 180, 180),
			})
		);
		versadex_link.addComponent(new PlaneShape());
		const seeThrough = new Material();
		seeThrough.albedoColor = new Color4(0, 0, 0, 0);
		versadex_link.addComponent(seeThrough);
		versadex_link.addComponent(
			new OnPointerDown(
				() => {
					openExternalURL("https://versadex.xyz");
				},
				{ hoverText: "Advertise or monetise with Versadex" }
			)
		);

		// create the paper which displays the creative
		const paper = new Entity();
		paper.setParent(backboard);

		// need to link scale to reflect the size of the object in the world, not necessarily the actual dimensions
		paper.addComponent(
			new Transform({
				position: new Vector3(0, 0.5, -0.02),
				scale: new Vector3(0.9, 0.9, 1),
				rotation: Quaternion.Euler(0, 360, 180),
			})
		);

		const paperCollider = new PlaneShape();
		paperCollider.withCollisions = false;

		paper.addComponent(paperCollider);
		const myMaterial = new Material();

		let paperScales = paper.getComponent(Transform).scale;

		enum PaperSize {
			dimensionX = paperScales.x * ChangedBackboardTransform.dimensionX,
			dimensionY = paperScales.y * ChangedBackboardTransform.dimensionY,
			dimensionZ = paperScales.z * ChangedBackboardTransform.dimensionZ,
		}

		let backendCall =
			baseURL +
			"/c/u/" +
			props.id +
			"/gc/?x=" +
			PaperSize.dimensionX +
			"&y=" +
			PaperSize.dimensionY +
			"&creative_type=img" +
			"&viewer=";

		try {
			executeTask(async () => {
				let response = await fetch(
					backendCall +
						(
							await this.userData
						).userId +
						"&client_identifier=" +
						identifier
				);
				let json = await response.json();
				const myTexture = new Texture(json.creative_url, { wrap: 1 });
				myMaterial.albedoTexture = myTexture;
				paper.addComponent(myMaterial);
				paper.addComponent(
					new OnPointerDown(
						() => {
							openExternalURL(json.landing_url);
						},
						{ hoverText: "Visit website", distance: 800 }
					)
				);
				// set campaign ID
				const billboardTransform = host.getComponent(Transform);
				const impression = new VersadexImpression(
					props.id,
					json.id,
					billboardTransform,
					identifier,
					json.impression_id
				);
				engine.addSystem(impression);
			});
		} catch {
			log("failed to reach URL");
		}
	}
}
