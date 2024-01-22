import { DependencyContainer} from "tsyringe";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ImageRouter } from "@spt-aki/routers/ImageRouter";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { BaseClasses } from  "@spt-aki/models/enums/BaseClasses";
import * as path from "path";
const fs = require('fs');
const modPath = path.normalize(path.join(__dirname, '..'));
import * as MMAQLconfig from "../config.json"

class MMAQL implements IPostDBLoadMod {

    public mod: string;
    public modShortName:    string;
    public weaponArrays: Record<string, string[]> = {};
    public weaponPartsAndMods: Record<string, string[]> = {};
    public equipmentLists: Record<string, string[]> = {};
    public questConfigs: {
        questsItemCounterMultipliers: Record<string, number>,
        questsKillsCounterMultipliers: Record<string, number>,
        questsCultistsKillsCounterMultipliers: Record<string, number>,
        questsLevelRequirements: Record<string, number>
    } = {
        questsItemCounterMultipliers: {},
        questsKillsCounterMultipliers: {},
        questsCultistsKillsCounterMultipliers: {},
        questsLevelRequirements: {}
    };

    public itemHelper: ItemHelper;
    public logger: ILogger;

    constructor() {
        this.mod = "MusicManiac-MusicManiacAdvancedQuestLoader";
        this.modShortName = "MMAQL";
    }

    public postDBLoad(container: DependencyContainer): void 
    {
        const database = container.resolve<DatabaseServer>("DatabaseServer").getTables();
        const imageRouter = container.resolve<ImageRouter>("ImageRouter");
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const config = container.resolve<ConfigServer>("ConfigServer").getConfig(ConfigTypes.QUEST);
        this.itemHelper = container.resolve<ItemHelper>("ItemHelper");

        this.loadConfigs(`${modPath}/configs/`);
        this.configureCategories(database.templates.items);
        this.importQuests(database, config, `${modPath}/database/quests/`);
        this.importLocales(database, `${modPath}/database/locales/`);
        this.routeImages(imageRouter, `${modPath}/res/quests/`);
    }

    public configureCategories(itemDB) {
        const weaponCategories = [
            "pistols762x25", "SMGs762x25",
            "pistols9x18", "SMGs9x18",
            "pistols9x19", "revolvers9x19", "SMGs9x19",
            "pistols9x21", "SMGs9x21",
            "revolvers357",
            "pistols45", "SMGs45",
            "SMGs46x30",
            "pistols57x28", "SMGs57x28",
            "assaultRifles545x39", "assaultCarbines545x39", "LMGs545x39",
            "assaultRifles556x45", "assaultCarbines556x45",
            "assaultRifles68x51",
            "assaultRifles300",
            "assaultRifles762x39", "assaultCarbines762x39", "LMGs762x39",
            "assaultRifles762x51", "assaultCarbines762x51", "DMRs762x51", "sniperRifles762x51",
            "assaultCarbines762x54", "LMGs762x54", "shotguns762x54", "DMRs762x54", "sniperRifles762x54",
            "DMRs338", "sniperRifles338",
            "assaultCarbines9x39", "assaultRifles9x39", "DMRs9x39",
            "assaultCarbines366", "assaultRifles366", "sniperRifles366",
            "revolvers127x55", "assaultRifles127x55",
            "shotguns12x70", "revolvers12x70",
            "shotguns20x70",
            "shotguns23x73",

            "SMGs", "pistols", "revolvers", "assaultRifles", "assaultCarbines", "LMGs", "shotguns", "DMRs", "sniperRifles"
        ];

        weaponCategories.forEach(category => {
            this.weaponArrays[category] = [];
        });

        const weaponPartsAndModsCategories = [
            "scopes30mm",
            "flashlights", "tacticalComboDevices"
        ];

        weaponPartsAndModsCategories.forEach(category => {
            this.weaponPartsAndMods[category] = [];
        });

        const equipmentsCategories = [
            "noneYet"
        ];
        
        equipmentsCategories.forEach(category => {
            this.equipmentLists[category] = [];
        });

        this.parseItemsDatabase(itemDB);

        if (MMAQLconfig.debug.show_All_Categories_And_Things_In_Them) {
            weaponCategories.forEach(category => {
                console.log(`Items in category ${category}:`, JSON.stringify((this.weaponArrays[category]));
            });
    
            weaponPartsAndModsCategories.forEach(category => {
                console.log(`Items in category ${category}:`, JSON.stringify(this.weaponPartsAndMods[category]));
            });
    
            equipmentsCategories.forEach(category => {
                console.log(`Items in category ${category}:`, JSON.stringify(this.equipmentLists[category]));
            });
        }     
    }

    public parseItemsDatabase(itemDB) {
        this.weaponPartsAndMods.scopes30mm = itemDB["5bfebc5e0db834001a6694e5"]._props.Slots[0]._props.filters[0].Filter; // grab all 30mm scopes from M700 30mm integral ring scope mount

        for (let item in itemDB) {
            if (itemDB[item]._type != "Node") {
                const itemId = itemDB[item]._id;
                if (itemDB[item]._props.hasOwnProperty("ammoCaliber")) {
                    const caliber = itemDB[item]._props.ammoCaliber;
                    if (caliber == "Caliber30x29" || caliber == "Caliber40x46" || itemId == "5ae083b25acfc4001a5fc702") {
                        this.logger.info(`[${this.modShortName}] skipping item ${itemId} (its not important to this mod)`);
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.PISTOL)) {
                        this.weaponArrays.pistols.push(itemId);
                        if (caliber == "Caliber762x25TT") {
                            this.weaponArrays.pistols762x25.push(itemId);
                        } else if (caliber == "Caliber9x18PM") {
                            this.weaponArrays.pistols9x18.push(itemId);
                        } else if (caliber == "Caliber9x19PARA") {
                            this.weaponArrays.pistols9x19.push(itemId);
                        } else if (caliber == "Caliber9x21") {
                            this.weaponArrays.pistols9x21.push(itemId);
                        } else if (caliber == "Caliber1143x23ACP") {
                            this.weaponArrays.pistols45.push(itemId);
                        } else if (caliber == "Caliber57x28") {
                            this.weaponArrays.pistols57x28.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] pistol ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.SMG)) {
                        this.weaponArrays.SMGs.push(itemId);
                        if (caliber == "Caliber762x25TT") {
                            this.weaponArrays.SMGs762x25.push(itemId);
                        } else if (caliber == "Caliber9x18PM" || caliber == "Caliber9x18PMM") {
                            this.weaponArrays.SMGs9x18.push(itemId);
                        } else if (caliber == "Caliber9x19PARA") {
                            this.weaponArrays.SMGs9x19.push(itemId);
                        } else if (caliber == "Caliber9x21") {
                            this.weaponArrays.SMGs9x21.push(itemId);
                        } else if (caliber == "Caliber1143x23ACP") {
                            this.weaponArrays.SMGs45.push(itemId);
                        } else if (caliber == "Caliber57x28") {
                            this.weaponArrays.SMGs57x28.push(itemId);
                        } else if (caliber == "Caliber46x30") {
                            this.weaponArrays.SMGs46x30.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] SMG ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.REVOLVER)) {
                        this.weaponArrays.revolvers.push(itemId);
                        if (caliber == "Caliber9x19PARA") {
                            this.weaponArrays.revolvers9x19.push(itemId);
                        } else if (caliber == "Caliber127x55") {
                            this.weaponArrays.revolvers127x55.push(itemId);
                        } else if (caliber == "Caliber9x33R") {
                            this.weaponArrays.revolvers357.push(itemId);
                        } else if (caliber == "Caliber12g") {
                            this.weaponArrays.revolvers12x70.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] revolver ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.ASSAULT_CARBINE)) {
                        this.weaponArrays.assaultCarbines.push(itemId);
                        if (caliber == "Caliber545x39") {
                            this.weaponArrays.assaultCarbines545x39.push(itemId);
                        } else if (caliber == "Caliber556x45NATO") {
                            this.weaponArrays.assaultCarbines556x45.push(itemId);
                        } else if (caliber == "Caliber762x39") {
                            this.weaponArrays.assaultCarbines762x39.push(itemId);
                        } else if (caliber == "Caliber762x51") {
                            this.weaponArrays.assaultCarbines762x51.push(itemId);
                        } else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.assaultCarbines762x54.push(itemId);
                        } else if (caliber == "Caliber9x39") {
                            this.weaponArrays.assaultCarbines9x39.push(itemId);
                        } else if (caliber == "Caliber366TKM") {
                            this.weaponArrays.assaultCarbines366.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] assault carbine ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.ASSAULT_RIFLE)) {
                        this.weaponArrays.assaultRifles.push(itemId);
                        if (caliber == "Caliber545x39") {
                            this.weaponArrays.assaultRifles545x39.push(itemId);
                        } else if (caliber == "Caliber556x45NATO") {
                            this.weaponArrays.assaultRifles556x45.push(itemId);
                        } else if (caliber == "Caliber762x35") {
                            this.weaponArrays.assaultRifles300.push(itemId);
                        } else if (caliber == "Caliber762x39") {
                            this.weaponArrays.assaultRifles762x39.push(itemId);
                        } else if (caliber == "Caliber762x51") {
                            this.weaponArrays.assaultRifles762x51.push(itemId);
                        } else if (caliber == "Caliber9x39") {
                            this.weaponArrays.assaultRifles9x39.push(itemId);
                        } else if (caliber == "Caliber127x55") {
                            this.weaponArrays.assaultRifles127x55.push(itemId);
                        } else if (caliber == "Caliber366TKM") {
                            this.weaponArrays.assaultRifles366.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] assault rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.MACHINE_GUN)) {
                        this.weaponArrays.LMGs.push(itemId);
                        if (caliber == "Caliber545x39") {
                            this.weaponArrays.LMGs545x39.push(itemId);
                        } else if (caliber == "Caliber762x39") {
                            this.weaponArrays.LMGs762x39.push(itemId);
                        } else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.LMGs762x54.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] LMG ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.MARKSMAN_RIFLE)) {
                        this.weaponArrays.DMRs.push(itemId);
                        if (caliber == "Caliber86x70") {
                            this.weaponArrays.DMRs338.push(itemId);
                        } else if (caliber == "Caliber762x51") {
                            this.weaponArrays.DMRs762x51.push(itemId);
                        } else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.DMRs762x54.push(itemId);
                        } else if (caliber == "Caliber9x39") {
                            this.weaponArrays.DMRs9x39.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] DMR ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.SNIPER_RIFLE)) {
                        this.weaponArrays.sniperRifles.push(itemId);
                        if (caliber == "Caliber86x70") {
                            this.weaponArrays.sniperRifles338.push(itemId);
                        } else if (caliber == "Caliber762x51") {
                            this.weaponArrays.sniperRifles762x51.push(itemId);
                        } else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.sniperRifles762x54.push(itemId);
                        } else if (caliber == "Caliber366TKM") {
                            this.weaponArrays.sniperRifles366.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] sniper rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    } else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.SHOTGUN)) {
                        this.weaponArrays.shotguns.push(itemId);
                        if (caliber == "Caliber12g") {
                            this.weaponArrays.shotguns12x70.push(itemId);
                        } else if (caliber == "Caliber20g") {
                            this.weaponArrays.shotguns20x70.push(itemId);
                        } else if (caliber == "Caliber23x75") {
                            this.weaponArrays.shotguns23x73.push(itemId);
                        } else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.shotguns762x54.push(itemId);
                        } else {
                            this.logger.error(`[${this.modShortName}] sniper rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                }
                if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.FLASHLIGHT)) {
                    this.weaponPartsAndMods.flashlights.push(itemId);
                }
                if (this.itemHelper.isOfBaseclass(itemId, BaseClasses.TACTICAL_COMBO )) {
                    this.weaponPartsAndMods.tacticalComboDevices.push(itemId);
                }
            }
        }
    }

    public loadConfigs(directoryPath: string): void {
        let questConfigs = this.questConfigs;
        const modShortName = this.modShortName;
        function traverse(dir: string): void {
            const files = fs.readdirSync(dir);
            files.forEach((file) => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    traverse(filePath);
                } else if (path.extname(filePath).toLowerCase() === '.json') {
                    if (MMAQLconfig.debug.show_Files_Processing) {
                        console.log(`[${modShortName}] Processing file:`, filePath); 
                    }
                    try {
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        const jsonData = JSON.parse(fileContent);
                        if (jsonData.questsItemCounterMultipliers && Object.keys(jsonData.questsItemCounterMultipliers).length > 0) {
                            questConfigs.questsItemCounterMultipliers = {...questConfigs.questsItemCounterMultipliers, ...jsonData.questsItemCounterMultipliers};
                            //console.log("questsItemCounterMultipliers:", questsFile.questsItemCounterMultipliers);
                        }
            
                        if (jsonData.questsKillsCounterMultipliers && Object.keys(jsonData.questsKillsCounterMultipliers).length > 0) {
                            questConfigs.questsKillsCounterMultipliers = {...questConfigs.questsKillsCounterMultipliers, ...jsonData.questsKillsCounterMultipliers};
                            //console.log("questsKillsCounterMultipliers:", questsFile.questsKillsCounterMultipliers);
                        }
            
                        if (jsonData.questsCultistsKillsCounterMultipliers && Object.keys(jsonData.questsCultistsKillsCounterMultipliers).length > 0) {
                            questConfigs.questsCultistsKillsCounterMultipliers = {...questConfigs.questsCultistsKillsCounterMultipliers, ...jsonData.questsCultistsKillsCounterMultipliers};
                            //console.log("questsCultistsKillsCounterMultipliers:", questsFile.questsCultistsKillsCounterMultipliers);
                        }
            
                        if (jsonData.questsLevelRequirements && Object.keys(jsonData.questsLevelRequirements).length > 0) {
                            questConfigs.questsLevelRequirements = {...questConfigs.questsLevelRequirements, ...jsonData.questsLevelRequirements};
                            //console.log("questsLevelRequirements:", questsFile.questsLevelRequirements);
                        }
                    } catch (error) {
                        console.error(`Error reading or parsing JSON file ${filePath}:`, error);
                    }
                }
            });
        }    
        traverse(directoryPath);
    }

    public importQuests(database, config, directoryPath) {
        let questCount = 0
        let questConfigs = this.questConfigs;
        let weaponArrays = this.weaponArrays;
        let weaponPartsAndMods = this.weaponPartsAndMods;
        let equipmentLists = this.equipmentLists;
        let logger = this.logger;
        let modShortName = this.modShortName;
        let parseHandoverItems = this.parseHandoverItems;
        let parseWeapons = this.parseWeapons;
        let parseEquipmentExclusive = this.parseEquipmentExclusive;
        let parseEquipmentInclusive = this.parseEquipmentInclusive;
        let parseWeaponModsExclusive = this.parseWeaponModsExclusive;
        let parseWeaponModsInclusive = this.parseWeaponModsInclusive;
        
        function traverse(dir: string): void {
            const files = fs.readdirSync(dir);
            files.forEach((file) => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    traverse(filePath);
                } else if (path.extname(filePath).toLowerCase() === '.json') {
                    try {
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        const questsFile = JSON.parse(fileContent);
                        if (MMAQLconfig.debug.show_Files_Processing) {
                            console.log(`[${modShortName}] Processing file:`, filePath); 
                        }
                        if (Object.keys(questsFile).length < 1) return 
                        for (const quest of Object.keys(questsFile)) {
                            const questContent = questsFile[quest]
                            //console.log(`Processing quest: \`${questContent._id}\'`)
                            //process quest condition configuration options
                            for (const nextCondition of questContent.conditions.AvailableForFinish) {
                                const nextConditionData = nextCondition;
                                if (nextConditionData._parent == "CounterCreator" && nextConditionData._props.counter.id == "thisIsSetInCode") {
                                    nextConditionData._props.counter.id = nextConditionData._props.id + " counterId"
                                    if (MMAQLconfig.debug.show_Quest_Ids_Set_By_Code) {
                                        logger.info(`[${modShortName}] Setting \`${questContent._id}\' subCondition \`${nextConditionData._props.id}\` counter id to \`${nextConditionData._props.counter.id}\``);
                                    }
                                }
                                if (nextConditionData._parent == "CounterCreator" && nextConditionData._props.type == "Elimination") {
                                    let counterElimination = 0;
                                    let cultistsIncluded = false;
                                    for (const subCondition of nextConditionData._props.counter.conditions) {
                                        const subConditionData = subCondition;
                                        if (subConditionData.id == "thisIsRandomizedInCode") {
                                            subConditionData.id = Math.random().toString(36).substring(2, 20);
                                            if (MMAQLconfig.debug.show_Quest_Ids_Set_By_Code) {
                                                logger.info(`[${modShortName}] Setting \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} id to \`${subConditionData.id}\``);
                                            }
                                        }
                                        // replace Kills properties
                                        if (subConditionData._parent == "Kills") {
                                            if (subConditionData._props.savageRole && subConditionData._props.savageRole.includes("sectantWarrior")) {
                                                cultistsIncluded = true;
                                            }
                                            if (Array.isArray(subConditionData._props.weapon)) {
                                                parseWeapons(subConditionData, weaponArrays, logger, modShortName, questContent, nextConditionData, counterElimination);
                                                if (subConditionData._props.weapon.length === 0) {
                                                    logger.error(`[${modShortName}] Quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} weapon array is empty!`);
                                                }
                                            }
                                            if (Array.isArray(subConditionData._props.weaponModsInclusive)) {
                                                parseWeaponModsInclusive(subConditionData, weaponPartsAndMods, logger, modShortName, questContent, nextConditionData, counterElimination);
                                                if (subConditionData._props.weaponModsInclusive.length === 0) {
                                                    logger.error(`[${modShortName}] Quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} weaponModsInclusive array is empty!`);
                                                }
                                            }
                                            if (Array.isArray(subConditionData._props.weaponModsExclusive)) {
                                                parseWeaponModsExclusive(subConditionData, weaponPartsAndMods, logger, modShortName, questContent, nextConditionData, counterElimination);
                                                if (subConditionData._props.weaponModsExclusive.length === 0) {
                                                    logger.error(`[${modShortName}] Quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} weaponModsExclusive array is empty!`);
                                                }
                                            }
                                            if (Array.isArray(subConditionData._props.equipmentInclusive)) {
                                                parseEquipmentInclusive(subConditionData, equipmentLists, logger, modShortName, questContent, nextConditionData, counterElimination);
                                                if (subConditionData._props.equipmentInclusive.length === 0) {
                                                    logger.error(`[${modShortName}] Quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} equipmentInclusive array is empty!`);
                                                }
                                            }
                                            if (Array.isArray(subConditionData._props.equipmentExclusive)) {
                                                parseEquipmentExclusive(subConditionData, equipmentLists, logger, modShortName, questContent, nextConditionData, counterElimination);
                                                if (subConditionData._props.equipmentExclusive.length === 0) {
                                                    logger.error(`[${modShortName}] Quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} equipmentExclusive array is empty!`);
                                                }
                                            }
                                        }
                                        counterElimination++;
                                    }
                                    const initialValue = nextConditionData._props.value;
                                    if (cultistsIncluded && questConfigs.questsCultistsKillsCounterMultipliers.hasOwnProperty(questContent._id)) {
                                        const multiplier = questConfigs.questsCultistsKillsCounterMultipliers[questContent._id];
                                        nextConditionData._props.value *= multiplier;
                                        nextConditionData._props.value = Math.ceil(nextConditionData._props.value);
                                        if (config.show_Kills_Multipliers_Being_Applied) {
                                            logger.info(`[${modShortName}] applying multiplier from config to quest \`${questContent._id}\`: ${initialValue} * ${multiplier} = ${nextConditionData._props.value}`);
                                        }
                                    } else if (questConfigs.questsKillsCounterMultipliers.hasOwnProperty(questContent._id)) {
                                        const multiplier = questConfigs.questsKillsCounterMultipliers[questContent._id];
                                        nextConditionData._props.value *= multiplier;
                                        nextConditionData._props.value = Math.ceil(nextConditionData._props.value);
                                        if (config.show_Kills_Multipliers_Being_Applied) {
                                            logger.info(`[${modShortName}] applying multiplier from config to quest \`${questContent._id}\`: ${initialValue} * ${multiplier} = ${nextConditionData._props.value}`);
                                        }
                                    }
                                }
                                if (nextConditionData._parent == "HandoverItem") {
                                    const initialValue = nextConditionData._props.value; 
                                    if (questConfigs.questsItemCounterMultipliers.hasOwnProperty(questContent._id)) {
                                        const multiplier = questConfigs.questsItemCounterMultipliers[questContent._id];
                                        nextConditionData._props.value *= multiplier;
                                        nextConditionData._props.value = Math.ceil(nextConditionData._props.value);
                                        if (config.show_Items_Multipliers_Being_Applied) {
                                            logger.info(`[${modShortName}] applying multiplier from config to quest \`${questContent._id}\`: ${initialValue} * ${multiplier} = ${nextConditionData._props.value}`);
                                        }
                                    }
                                    if (Array.isArray(nextConditionData._props.target)) {
                                        parseHandoverItems(nextConditionData, weaponPartsAndMods, logger, modShortName, questContent, equipmentLists, weaponArrays);
                                    }
                                }
                            }
            
                            for (const nextCondition of questContent.conditions.AvailableForStart) {
                                const nextConditionData = nextCondition;
                                const randomString = Math.random().toString(36).substring(2, 20);
                                if (nextConditionData._parent == "Level" && nextConditionData._props.id == "thisIsRandomizedInCode") {
                                    nextConditionData._props.id = randomString;
                                    if (MMAQLconfig.debug.show_Quest_Ids_Set_By_Code) {
                                        logger.info(`[${modShortName}] Setting \`${questContent._id}\' starting level condition id to \`${nextConditionData._props.id}\``);
                                    }
                                    if (questConfigs.questsLevelRequirements.hasOwnProperty(questContent._id)) {
                                        nextConditionData._props.value = questConfigs.questsLevelRequirements[questContent._id];
                                    }
                                } else if (nextConditionData._parent == "Quest" && nextConditionData._props.id == "thisIsRandomizedInCode") {
                                    nextConditionData._props.id = randomString;
                                    if (MMAQLconfig.debug.show_Quest_Ids_Set_By_Code) {
                                        logger.info(`[${modShortName}] Setting \`${questContent._id}\' quest completion check id to \`${nextConditionData._props.id}\``);
                                    }
                                }
                            }
                            if (questsFile[quest].side == "Usec") config.usecOnlyQuests.push(quest)
                            if (questsFile[quest].side == "Bear") config.bearOnlyQuests.push(quest)
                            questsFile[quest].side = "Pmc"
                            database.templates.quests[quest] = questsFile[quest]
                            questCount++
                        }
                    } catch (error) {
                        console.error(`Error reading or parsing JSON file ${filePath}:`, error);
                    }
                }
            });
        }    
        traverse(directoryPath);
        
        logger.success(`[${modShortName}] Loaded ${questCount} custom quests.`)
    }

    public parseEquipmentExclusive(subConditionData: any, equipmentLists: Record<string, string[]>, logger: ILogger, modShortName: string, questContent: any, nextConditionData: any, counterElimination: number) {
        const isCorrectFormat = subConditionData._props.equipmentExclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.equipmentExclusive = subConditionData._props.equipmentExclusive.reduce((acc, equipment) => {
                // Check if the weaponMods is a key in weaponModsInclusive
                if (equipmentLists.hasOwnProperty(equipment)) {
                    const equipmentArray = equipmentLists[equipment];
                    // Concatenate each ID into a separate array
                    const separatedArrays = equipmentArray.map(equipmentId => [equipmentId]);
                    if (MMAQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${equipment}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    // Concatenate the arrays into the accumulator
                    return acc.concat(separatedArrays);
                } else {
                    // If not found, concatenate the original weaponId
                    return acc.concat([[equipment]]);
                }
            }, []);
            if (MMAQLconfig.debug.show_Equipment_Used_By_Each_Condition) {
                logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` excluded equipment list: ${JSON.stringify(subConditionData._props.equipmentExclusive)}`);
            }
        }
    }

    public parseEquipmentInclusive(subConditionData: any, equipmentLists: Record<string, string[]>, logger: ILogger, modShortName: string, questContent: any, nextConditionData: any, counterElimination: number) {
        const isCorrectFormat = subConditionData._props.equipmentInclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.equipmentInclusive = subConditionData._props.equipmentInclusive.reduce((acc, equipment) => {
                // Check if the weaponMods is a key in weaponModsInclusive
                if (equipmentLists.hasOwnProperty(equipment)) {
                    const equipmentArray = equipmentLists[equipment];
                    // Concatenate each ID into a separate array
                    const separatedArrays = equipmentArray.map(equipmentId => [equipmentId]);
                    if (MMAQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${equipment}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    // Concatenate the arrays into the accumulator
                    return acc.concat(separatedArrays);
                } else {
                    // If not found, concatenate the original weaponId
                    return acc.concat([[equipment]]);
                }
            }, []);
            if (MMAQLconfig.debug.show_Equipment_Used_By_Each_Condition) {
                logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` included equipment list: ${JSON.stringify(subConditionData._props.equipmentInclusive)}`);
            }
        }
    }

    public parseHandoverItems(nextConditionData: any, weaponPartsAndMods: Record<string, string[]>, logger: ILogger, modShortName: string, questContent: any, equipmentLists: Record<string, string[]>, weaponArrays: Record<string, string[]>) {
        nextConditionData._props.target = nextConditionData._props.target.reduce((acc, category) => {
            // Check for categories across all our categories groups
            if (weaponPartsAndMods.hasOwnProperty(category)) {
                // Concatenate the corresponding array from weaponPartsAndMods
                if (MMAQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${category}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                }
                return acc.concat(weaponPartsAndMods[category]);
            } else if (equipmentLists.hasOwnProperty(category)) {
                // Concatenate the corresponding array from equipmentLists
                if (MMAQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${category}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                }
                return acc.concat(equipmentLists[category]);
            } else if (weaponArrays.hasOwnProperty(category)) {
                // Concatenate the corresponding array from weaponArrays
                if (MMAQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${category}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                }
                return acc.concat(weaponArrays[category]);
            } else {
                // If not found, concatenate the original id
                return acc.concat(category);
            }
        }, []);
        if (MMAQLconfig.debug.show_Equipment_Used_By_Each_Condition || MMAQLconfig.debug.show_Weapon_Mods_Used_By_Each_Condition || MMAQLconfig.debug.show_Weapons_Used_By_Each_Condition) {
            logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` items/mods/weapons/ids: ${JSON.stringify(nextConditionData._props.target)}`);
        }
    }

    public parseWeapons(subConditionData: any, weaponArrays: Record<string, string[]>, logger: ILogger, modShortName: string, questContent: any, nextConditionData: any, counterElimination: number) {
        subConditionData._props.weapon = subConditionData._props.weapon.reduce((acc, weaponId) => {
            // Check if the weaponId is a key in weaponArrays
            if (weaponArrays.hasOwnProperty(weaponId)) {
                // Concatenate the corresponding array from weaponArrays
                if (MMAQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${weaponId}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                }
                return acc.concat(weaponArrays[weaponId]);
            } else {
                // If not found, concatenate the original weaponId
                return acc.concat(weaponId);
            }
        }, []);
        if (MMAQLconfig.debug.show_Weapons_Used_By_Each_Condition) {
            logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` required weapons: ${JSON.stringify(subConditionData._props.weapon)}`);
        }
    }

    public parseWeaponModsExclusive(subConditionData: any, weaponPartsAndMods: Record<string, string[]>, logger: ILogger, modShortName: string, questContent: any, nextConditionData: any, counterElimination: number) {
        const isCorrectFormat = subConditionData._props.weaponModsExclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.weaponModsExclusive = subConditionData._props.weaponModsExclusive.reduce((acc, weaponMods) => {
                // Check if the weaponMods is a key in weaponModsExclusive
                if (weaponPartsAndMods.hasOwnProperty(weaponMods)) {
                    const modsArray = weaponPartsAndMods[weaponMods];
                    // Concatenate each ID into a separate array
                    const separatedArrays = modsArray.map(modId => [modId]);
                    if (MMAQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${weaponMods}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    // Concatenate the arrays into the accumulator
                    return acc.concat(separatedArrays);
                } else {
                    // If not found, concatenate the original weaponId
                    return acc.concat([[weaponMods]]);
                }
            }, []);
            if (MMAQLconfig.debug.show_Weapon_Mods_Used_By_Each_Condition) {
                logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` excluded weapon mods: ${JSON.stringify(subConditionData._props.weaponModsInclusive)}`);
            }
        }
    }

    public parseWeaponModsInclusive(subConditionData: any, weaponPartsAndMods: Record<string, string[]>, logger: ILogger, modShortName: string, questContent: any, nextConditionData: any, counterElimination: number) {
        const isCorrectFormat = subConditionData._props.weaponModsInclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.weaponModsInclusive = subConditionData._props.weaponModsInclusive.reduce((acc, weaponMods) => {
                if (weaponPartsAndMods.hasOwnProperty(weaponMods)) {
                    const modsArray = weaponPartsAndMods[weaponMods];
                    const separatedArrays = modsArray.map(modId => [modId]);
                    if (MMAQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${weaponMods}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    return acc.concat(separatedArrays);
                } else {
                    return acc.concat([[weaponMods]]);
                }
            }, []);
        }

        if (MMAQLconfig.debug.show_Weapon_Mods_Used_By_Each_Condition) {
            logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` included weapon mods: ${JSON.stringify(subConditionData._props.weaponModsInclusive)}`);
        }
    }

    public importLocales(database, directoryPath: string) {
        const serverLocales = ['ch','cz','en','es','es-mx','fr','ge','hu','it','jp','pl','po','ru','sk','tu']
        const addedLocales = {}
        const modShortName = this.modShortName;
        for (const locale of serverLocales) {
            //directoryPath += locale + '/';
            function traverse(dir: string ): void {
                const files = fs.readdirSync(dir);
                files.forEach((file) => {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        traverse(filePath);
                    } else if (path.extname(filePath).toLowerCase() === '.json') {
                        if (MMAQLconfig.debug.show_Files_Processing) {
                            console.log(`[${modShortName}] Processing file:`, filePath);
                        }
                        try {
                            const fileContent = fs.readFileSync(filePath, 'utf-8');
                            const localeFile = JSON.parse(fileContent);
                            for (const localeString in localeFile) {
                                database.locales.global[locale][localeString] = localeFile[localeString]
                                if (!Object.keys(addedLocales).includes(locale)) addedLocales[locale] = {}
                                addedLocales[locale][localeString] = localeFile[localeString]
                            }
                        } catch (error) {
                            console.error(`Error reading or parsing JSON file ${filePath}:`, error);
                        }
                    }
                });
            }
            traverse(directoryPath + locale + '/');
        }

        for (const locale of serverLocales) {
            if (locale == "en") continue
            for (const englishItem in addedLocales["en"]) {
                if (locale in addedLocales) { 
                    if (englishItem in addedLocales[locale]) continue
                }
                if (database.locales.global[locale] != undefined) database.locales.global[locale][englishItem] = addedLocales["en"][englishItem]
            }
        }
    }

    public routeImages(imageRouter, directoryPath) {
        let imageCount = 0;
        const modShortName = this.modShortName;
        function traverse(dir: string): void {
            const files = fs.readdirSync(dir);
            files.forEach((file) => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    traverse(filePath);
                } else if (path.extname(filePath).toLowerCase() === '.png' || path.extname(filePath).toLowerCase() === '.jpg') {
                    if (MMAQLconfig.debug.show_Files_Processing) {
                        console.log(`[${modShortName}] Processing file:`, filePath);
                    }
                    imageRouter.addRoute(`/files/quest/icon/${path.basename(filePath, path.extname(filePath))}`, filePath);
                    imageCount++;
                }
            });
        }
        traverse(directoryPath);
        this.logger.success(`[${this.modShortName}] Loaded ${imageCount} custom images.`)
    }
}

module.exports = { mod: new MMAQL() }