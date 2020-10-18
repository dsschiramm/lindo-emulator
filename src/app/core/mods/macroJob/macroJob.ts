import { IpcRendererService } from 'app/core/electron/ipcrenderer.service';
import { SettingsService } from 'app/core/service/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { Mod } from '../mod';
import { Logger } from 'app/core/electron/logger.helper';

export class MacroJob extends Mod {
	private interativePath: any = [];
	private mapId: number = null;
	private mapNotChange: boolean = false;
	private jobPath = [];

	constructor(
		wGame: any,
		settings: SettingsService,
		translate: TranslateService,
		private ipcRendererService: IpcRendererService
	) {
		super(wGame, settings, translate);
		this.ipcRendererService = ipcRendererService;
		this.params = this.settings.option.vip.general;

		if (this.params.macro_job) {
			let onGameMapMovementMessage = (msg: any) => {
				if (!this.mapId || this.mapId != this.wGame.isoEngine.mapRenderer.mapId) {
					this.getInterativePath();
				} else if (this.mapNotChange) {
					this.updateInterativePath();
				}
			};

			let onInteractiveUseEndedMessage = (msg: any) => {
				this.interativeWIthPath();
			};

			let onInteractiveElementUpdatedMessage = (msg: any) => {
				this.updateInterativePath();
			};

			let onGameFightTurnStartMessage = (msg: any) => {
				Logger.info('-- FIGHT - ', msg);
				this.turnStart();
			};

			this.on(this.wGame.dofus.connectionManager, 'InteractiveUseEndedMessage', onInteractiveUseEndedMessage);
			this.on(this.wGame.dofus.connectionManager, 'InteractiveElementUpdatedMessage', onInteractiveElementUpdatedMessage);
			this.on(this.wGame.dofus.connectionManager, 'GameMapMovementMessage', onGameMapMovementMessage);
			this.on(this.wGame.dofus.connectionManager, 'GameFightTurnStartMessage', onGameFightTurnStartMessage);

			// GameMapChangeOrientationRequestMessage
			// InteractiveUseRequestMessage
			// MapInformationsRequestMessage
			// onInteractiveUsedMessage
			// this.wGame.dofus.sendMessage("PartyAcceptInvitationMessage", { partyId: partyId });
			// this.wGame.dofus.sendMessage("GameFightJoinRequestMessage", { fightId, fighterId });
			// useInteractiveByCellId
			// Logger.info(' - mainCharacter : ', this.wGame.gui.playerData.characters.mainCharacter);
		}
	}

	startMod(): void {
		return;
	}

	private interativeWIthPath() {
		let interativeRetry = () => {
			if (this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving) {
				setTimeout(interativeRetry, 300);
			} else if (this.interativePath.length) {
				this.wGame.isoEngine.useInteractive(this.interativePath[0].elemId, this.interativePath[0].skillInstanceUid);
			}
		};

		setTimeout(interativeRetry, 3000);
	}

	private insertPath(interactiveList: any) {
		for (let id in interactiveList) {
			let elemId = interactiveList[id].elementId;
			let exist = this.interativePath.filter((x) => x.elemId == elemId);

			if (!exist.length) {
				interactiveList[id].enabledSkills
					.filter(
						(data) =>
							(data._name == 'Cortar' && data._parentJobName == 'Lenhador') ||
							(data._name == 'Coletar' && data._parentJobName == 'Minerador')
					)
					.forEach((element) => {
						if (!this.mapNotChange && element._parentJobName == 'Minerador' && element._name == 'Coletar') {
							this.mapNotChange = true;
						}

						this.interativePath.push({ elemId: elemId, skillInstanceUid: element.skillInstanceUid });
					});
			}
		}
	}

	private getInterativePath() {
		this.mapNotChange = false;
		this.interativePath = [];
		this.mapId = this.wGame.isoEngine.mapRenderer.mapId;

		let interactiveList = this.wGame.isoEngine.mapRenderer.interactiveElements;

		this.insertPath(interactiveList);
		this.interativeWIthPath();
	}

	private updateInterativePath() {
		let interactiveList = this.wGame.isoEngine.mapRenderer.interactiveElements;

		this.insertPath(interactiveList);

		for (let index = this.interativePath.length - 1; index >= 0; index--) {
			let exist = false;

			for (let id in interactiveList) {
				if (!exist) {
					exist =
						interactiveList[id].elementId == this.interativePath[index].elemId &&
						interactiveList[id].enabledSkills.filter(
							(data) =>
								(data._name == 'Cortar' && data._parentJobName == 'Lenhador') ||
								(data._name == 'Coletar' && data._parentJobName == 'Minerador')
						).length;
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

	public turnStart() {
		try {
			let fighters = this.wGame.gui.fightManager.getFighters();

			Logger.info('-- FIGHT ================================================ ');
			Logger.info('-- fighters - ', fighters);
			Logger.info('-- FIGHT ================================================ ');

			let fighterId = null;

			for (let index in fighters) {
				let fighterC = this.wGame.gui.fightManager.getFighter(fighters[index]);
				if (fighterC.data.alive && fighterC.id !== this.wGame.gui.playerData.characters.mainCharacterId) {
					fighterId = fighterC.id;
				}
			}

			if (fighterId) {
				Logger.info('-- FIGHT ================================================ ');
				Logger.info('-- fighterId - ', fighterId);
				Logger.info('-- FIGHT ================================================ ');

				let fighter = this.wGame.gui.fightManager.getFighter(fighterId.id);

				Logger.info('-- FIGHT ================================================ ');
				Logger.info('-- fighter - ', fighter);
				Logger.info('-- FIGHT ================================================ ');

				if (this.wGame.isoEngine.mapRenderer.isFightMode) {
					if (fighter.data.alive) {
						let cellId = fighter.data.disposition.cellId;

						Logger.info('-- cellId ================================================ ');
						Logger.info('-- cellId - ', cellId);
						Logger.info('-- cellId ================================================ ');

						Logger.info('-- fighter.buffs ================================================ ');
						Logger.info('-- fighter.buffs - ', fighter.buffs);
						Logger.info('-- fighter.buffs ================================================ ');

						Logger.info('-- fighter.spells ================================================ ');
						Logger.info('-- fighter.spells - ', this.wGame.gui.playerData.characters.mainCharacter.spellData.spells);
						Logger.info('-- fighter.spells ================================================ ');
					}
				}
			}
		} catch (e) {
			Logger.info('-- FIGHT ERRROR ================================================ ');
			Logger.info('-- FIGHT ERRROR ================================================ ');
		}
	}

	public reset() {
		super.reset();
	}
}
