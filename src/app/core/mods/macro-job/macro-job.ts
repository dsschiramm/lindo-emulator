import { Mods } from "../mods";
import { Logger } from "app/core/electron/logger.helper";

export class MacroJob extends Mods {

	private interativePath: any = [];
	private mapId: number = null;
	private jobPath = [];

	constructor(
		wGame: any,
		private macro_job: boolean,
	) {
		super(wGame);

		if (this.macro_job) {

			let onGameMapMovementMessage = (msg: any) => {

				if (!this.mapId || this.mapId != this.wGame.isoEngine.mapRenderer.mapId) {
					Logger.info(' - MUDANCA MAP : ', this.wGame.isoEngine.mapRenderer.mapId);
					this.getInterativePath();
				}
			};

			let onInteractiveUseEndedMessage = (msg: any) => {
				Logger.info(' - JOB EXECUTADO ');
				this.interativeWIthPath();
			};

			let onInteractiveElementUpdatedMessage = (msg: any) => {
				Logger.info(' - VALIDAR PATH ');
				this.updateInterativePath();
			};

			this.on(this.wGame.dofus.connectionManager, 'InteractiveUseEndedMessage', onInteractiveUseEndedMessage);
			this.on(this.wGame.dofus.connectionManager, 'InteractiveElementUpdatedMessage', onInteractiveElementUpdatedMessage);
			this.on(this.wGame.dofus.connectionManager, 'GameMapMovementMessage', onGameMapMovementMessage);

			// GameMapChangeOrientationRequestMessage
			// InteractiveUseRequestMessage
			// MapInformationsRequestMessage
			// onInteractiveUsedMessage
			// this.wGame.dofus.sendMessage("PartyAcceptInvitationMessage", { partyId: partyId });
			// this.wGame.dofus.sendMessage("GameFightJoinRequestMessage", { fightId, fighterId });
			// useInteractiveByCellId
		}
	}

	private interativeWIthPath () {

		let interativeRetry = () => {

			if (this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving) {
				setTimeout(interativeRetry, 300);
			} else if (this.interativePath.length) {
				this.wGame.isoEngine.useInteractive(this.interativePath[0].elemId, this.interativePath[0].skillInstanceUid);
			}
		}

		setTimeout(interativeRetry, 12000);
	}

	private insertPath(interactiveList: any) {

		for (let id in interactiveList) {

			let elemId = interactiveList[id].elementId;
			let exist = this.interativePath.filter(x => x.elemId == elemId);

			if (!exist.length) {

				interactiveList[id].enabledSkills.filter(data => data._name == 'Cortar' && data._parentJobName == 'Lenhador').forEach(element => {
					this.interativePath.push({ elemId: elemId, skillInstanceUid: element.skillInstanceUid });
				});
			}
		}
	}

	private getInterativePath () {

		this.interativePath = [];
		this.mapId = this.wGame.isoEngine.mapRenderer.mapId;

		let interactiveList = this.wGame.isoEngine.mapRenderer.interactiveElements;

		this.insertPath(interactiveList);
		this.interativeWIthPath();
	}

	private updateInterativePath () {

		let interactiveList = this.wGame.isoEngine.mapRenderer.interactiveElements;

		this.insertPath(interactiveList);

		for (let index = this.interativePath.length-1; index >= 0; index--) {

			let exist = false;

			for (let id in interactiveList) {

				if (!exist) {
					exist = (interactiveList[id].elementId == this.interativePath[index].elemId &&
						interactiveList[id].enabledSkills.filter(data => data._name == 'Cortar' && data._parentJobName == 'Lenhador').length);
				}
			}

			if (!exist) {
				this.interativePath.splice(index, 1);
			}
		}

		if (this.interativePath.length === 1) {
			this.interativeWIthPath();
		} else if (this.interativePath.length === 0) {
			// this.wGame.dofus.sendMessage("ChangeMapMessage", { mapId: partyId });
		}
	}

	public reset() {
		super.reset();
	}
}