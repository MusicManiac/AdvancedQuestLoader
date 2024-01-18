"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const BaseClasses_1 = require("C:/snapshot/project/obj/models/enums/BaseClasses");
const path = __importStar(require("path"));
const fs = require('fs');
const modPath = path.normalize(path.join(__dirname, '..'));
const MMCQLconfig = __importStar(require("../config.json"));
class VCQL {
    mod;
    modShortName;
    weaponArrays = {};
    weaponPartsAndMods = {};
    equipmentLists = {};
    questConfigs = {
        questsItemCounterMultipliers: {},
        questsKillsCounterMultipliers: {},
        questsCultistsKillsCounterMultipliers: {},
        questsLevelRequirements: {}
    };
    itemHelper;
    logger;
    constructor() {
        this.mod = "MusicManiac-MusicManiacCustomQuestLoader";
        this.modShortName = "MMCQL";
        this.accumulateConfigs();
    }
    postDBLoad(container) {
        const database = container.resolve("DatabaseServer").getTables();
        const imageRouter = container.resolve("ImageRouter");
        this.logger = container.resolve("WinstonLogger");
        const config = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.QUEST);
        this.itemHelper = container.resolve("ItemHelper");
        this.configureCategories(database.templates.items);
        this.importQuests(database, config);
        this.importLocales(database);
        this.routeImages(imageRouter);
    }
    configureCategories(itemDB) {
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
    }
    parseItemsDatabase(itemDB) {
        this.weaponPartsAndMods.scopes30mm = itemDB["5bfebc5e0db834001a6694e5"]._props.Slots[0]._props.filters[0].Filter; // grab all 30mm scopes from M700 30mm integral ring scope mount
        for (let item in itemDB) {
            if (itemDB[item]._type != "Node") {
                const itemId = itemDB[item]._id;
                if (itemDB[item]._props.hasOwnProperty("ammoCaliber")) {
                    const caliber = itemDB[item]._props.ammoCaliber;
                    if (caliber == "Caliber30x29" || caliber == "Caliber40x46" || itemId == "5ae083b25acfc4001a5fc702") {
                        this.logger.info(`[${this.modShortName}] skipping item ${itemId} (its not important to this mod)`);
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.PISTOL)) {
                        this.weaponArrays.pistols.push(itemId);
                        if (caliber == "Caliber762x25TT") {
                            this.weaponArrays.pistols762x25.push(itemId);
                        }
                        else if (caliber == "Caliber9x18PM") {
                            this.weaponArrays.pistols9x18.push(itemId);
                        }
                        else if (caliber == "Caliber9x19PARA") {
                            this.weaponArrays.pistols9x19.push(itemId);
                        }
                        else if (caliber == "Caliber9x21") {
                            this.weaponArrays.pistols9x21.push(itemId);
                        }
                        else if (caliber == "Caliber1143x23ACP") {
                            this.weaponArrays.pistols45.push(itemId);
                        }
                        else if (caliber == "Caliber57x28") {
                            this.weaponArrays.pistols57x28.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] pistol ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.SMG)) {
                        this.weaponArrays.SMGs.push(itemId);
                        if (caliber == "Caliber762x25TT") {
                            this.weaponArrays.SMGs762x25.push(itemId);
                        }
                        else if (caliber == "Caliber9x18PM" || caliber == "Caliber9x18PMM") {
                            this.weaponArrays.SMGs9x18.push(itemId);
                        }
                        else if (caliber == "Caliber9x19PARA") {
                            this.weaponArrays.SMGs9x19.push(itemId);
                        }
                        else if (caliber == "Caliber9x21") {
                            this.weaponArrays.SMGs9x21.push(itemId);
                        }
                        else if (caliber == "Caliber1143x23ACP") {
                            this.weaponArrays.SMGs45.push(itemId);
                        }
                        else if (caliber == "Caliber57x28") {
                            this.weaponArrays.SMGs57x28.push(itemId);
                        }
                        else if (caliber == "Caliber46x30") {
                            this.weaponArrays.SMGs46x30.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] SMG ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.REVOLVER)) {
                        this.weaponArrays.revolvers.push(itemId);
                        if (caliber == "Caliber9x19PARA") {
                            this.weaponArrays.revolvers9x19.push(itemId);
                        }
                        else if (caliber == "Caliber127x55") {
                            this.weaponArrays.revolvers127x55.push(itemId);
                        }
                        else if (caliber == "Caliber9x33R") {
                            this.weaponArrays.revolvers357.push(itemId);
                        }
                        else if (caliber == "Caliber12g") {
                            this.weaponArrays.revolvers12x70.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] revolver ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.ASSAULT_CARBINE)) {
                        this.weaponArrays.assaultCarbines.push(itemId);
                        if (caliber == "Caliber545x39") {
                            this.weaponArrays.assaultCarbines545x39.push(itemId);
                        }
                        else if (caliber == "Caliber556x45NATO") {
                            this.weaponArrays.assaultCarbines556x45.push(itemId);
                        }
                        else if (caliber == "Caliber762x39") {
                            this.weaponArrays.assaultCarbines762x39.push(itemId);
                        }
                        else if (caliber == "Caliber762x51") {
                            this.weaponArrays.assaultCarbines762x51.push(itemId);
                        }
                        else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.assaultCarbines762x54.push(itemId);
                        }
                        else if (caliber == "Caliber9x39") {
                            this.weaponArrays.assaultCarbines9x39.push(itemId);
                        }
                        else if (caliber == "Caliber366TKM") {
                            this.weaponArrays.assaultCarbines366.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] assault carbine ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.ASSAULT_RIFLE)) {
                        this.weaponArrays.assaultRifles.push(itemId);
                        if (caliber == "Caliber545x39") {
                            this.weaponArrays.assaultRifles545x39.push(itemId);
                        }
                        else if (caliber == "Caliber556x45NATO") {
                            this.weaponArrays.assaultRifles556x45.push(itemId);
                        }
                        else if (caliber == "Caliber762x35") {
                            this.weaponArrays.assaultRifles300.push(itemId);
                        }
                        else if (caliber == "Caliber762x39") {
                            this.weaponArrays.assaultRifles762x39.push(itemId);
                        }
                        else if (caliber == "Caliber762x51") {
                            this.weaponArrays.assaultRifles762x51.push(itemId);
                        }
                        else if (caliber == "Caliber9x39") {
                            this.weaponArrays.assaultRifles9x39.push(itemId);
                        }
                        else if (caliber == "Caliber127x55") {
                            this.weaponArrays.assaultRifles127x55.push(itemId);
                        }
                        else if (caliber == "Caliber366TKM") {
                            this.weaponArrays.assaultRifles366.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] assault rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.MACHINE_GUN)) {
                        this.weaponArrays.LMGs.push(itemId);
                        if (caliber == "Caliber545x39") {
                            this.weaponArrays.LMGs545x39.push(itemId);
                        }
                        else if (caliber == "Caliber762x39") {
                            this.weaponArrays.LMGs762x39.push(itemId);
                        }
                        else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.LMGs762x54.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] LMG ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.MARKSMAN_RIFLE)) {
                        this.weaponArrays.DMRs.push(itemId);
                        if (caliber == "Caliber86x70") {
                            this.weaponArrays.DMRs338.push(itemId);
                        }
                        else if (caliber == "Caliber762x51") {
                            this.weaponArrays.DMRs762x51.push(itemId);
                        }
                        else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.DMRs762x54.push(itemId);
                        }
                        else if (caliber == "Caliber9x39") {
                            this.weaponArrays.DMRs9x39.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] DMR ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.SNIPER_RIFLE)) {
                        this.weaponArrays.sniperRifles.push(itemId);
                        if (caliber == "Caliber86x70") {
                            this.weaponArrays.sniperRifles338.push(itemId);
                        }
                        else if (caliber == "Caliber762x51") {
                            this.weaponArrays.sniperRifles762x51.push(itemId);
                        }
                        else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.sniperRifles762x54.push(itemId);
                        }
                        else if (caliber == "Caliber366TKM") {
                            this.weaponArrays.sniperRifles366.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] sniper rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                    else if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.SHOTGUN)) {
                        this.weaponArrays.shotguns.push(itemId);
                        if (caliber == "Caliber12g") {
                            this.weaponArrays.shotguns12x70.push(itemId);
                        }
                        else if (caliber == "Caliber20g") {
                            this.weaponArrays.shotguns20x70.push(itemId);
                        }
                        else if (caliber == "Caliber23x75") {
                            this.weaponArrays.shotguns23x73.push(itemId);
                        }
                        else if (caliber == "Caliber762x54R") {
                            this.weaponArrays.shotguns762x54.push(itemId);
                        }
                        else {
                            this.logger.error(`[${this.modShortName}] sniper rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                        }
                    }
                }
                if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.FLASHLIGHT)) {
                    this.weaponPartsAndMods.flashlights.push(itemId);
                }
                if (this.itemHelper.isOfBaseclass(itemId, BaseClasses_1.BaseClasses.TACTICAL_COMBO)) {
                    this.weaponPartsAndMods.tacticalComboDevices.push(itemId);
                }
            }
        }
    }
    accumulateConfigs() {
        let questConfigsRead = 0;
        this.loadFiles(`${modPath}/configs/`, [".json"], (filePath) => {
            console.log("Processing file:", filePath);
            try {
                const questsFile = require(filePath);
                // Check if the required properties exist in the JSON data
                if (questsFile.questsItemCounterMultipliers && Object.keys(questsFile.questsItemCounterMultipliers).length > 0) {
                    this.questConfigs.questsItemCounterMultipliers = { ...this.questConfigs.questsItemCounterMultipliers, ...questsFile.questsItemCounterMultipliers };
                    console.log("questsItemCounterMultipliers:", questsFile.questsItemCounterMultipliers);
                }
                if (questsFile.questsKillsCounterMultipliers && Object.keys(questsFile.questsKillsCounterMultipliers).length > 0) {
                    this.questConfigs.questsKillsCounterMultipliers = { ...this.questConfigs.questsKillsCounterMultipliers, ...questsFile.questsKillsCounterMultipliers };
                    console.log("questsKillsCounterMultipliers:", questsFile.questsKillsCounterMultipliers);
                }
                if (questsFile.questsCultistsKillsCounterMultipliers && Object.keys(questsFile.questsCultistsKillsCounterMultipliers).length > 0) {
                    this.questConfigs.questsCultistsKillsCounterMultipliers = { ...this.questConfigs.questsCultistsKillsCounterMultipliers, ...questsFile.questsCultistsKillsCounterMultipliers };
                    console.log("questsCultistsKillsCounterMultipliers:", questsFile.questsCultistsKillsCounterMultipliers);
                }
                if (questsFile.questsLevelRequirements && Object.keys(questsFile.questsLevelRequirements).length > 0) {
                    this.questConfigs.questsLevelRequirements = { ...this.questConfigs.questsLevelRequirements, ...questsFile.questsLevelRequirements };
                    console.log("questsLevelRequirements:", questsFile.questsLevelRequirements);
                }
                questConfigsRead++;
            }
            catch (error) {
                console.error(`Error processing JSON file ${filePath}:`, error.message);
            }
        });
        console.log("questConfigs:", this.questConfigs);
        console.log(`[${this.modShortName}] Loaded ${questConfigsRead} quest config files.`);
    }
    loadFiles(dirPath, extName, cb) {
        if (!fs.existsSync(dirPath))
            return;
        const dir = fs.readdirSync(dirPath, { withFileTypes: true });
        dir.forEach(item => {
            const itemPath = path.normalize(`${dirPath}/${item.name}`);
            if (item.isDirectory())
                this.loadFiles(itemPath, extName, cb);
            else if (extName.includes(path.extname(item.name)))
                cb(itemPath);
        });
    }
    importQuests(database, config) {
        let questCount = 0;
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
        this.loadFiles(`${modPath}/database/quests/`, [".json"], function (filePath) {
            const questsFile = require(filePath);
            console.log("Processing file:", filePath);
            if (Object.keys(questsFile).length < 1)
                return;
            for (const quest of Object.keys(questsFile)) {
                const questContent = questsFile[quest];
                console.log(`Processing quest: \`${questContent._id}\'`);
                //process quest condition configuration options
                for (const nextCondition of questContent.conditions.AvailableForFinish) {
                    const nextConditionData = nextCondition;
                    if (nextConditionData._parent == "CounterCreator" && nextConditionData._props.counter.id == "thisIsSetInCode") {
                        nextConditionData._props.counter.id = nextConditionData._props.id + " counterId";
                        if (MMCQLconfig.debug.show_Quest_Ids_Set_By_Code) {
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
                                if (MMCQLconfig.debug.show_Quest_Ids_Set_By_Code) {
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
                                }
                                if (Array.isArray(subConditionData._props.weaponModsInclusive)) {
                                    parseWeaponModsInclusive(subConditionData, weaponPartsAndMods, logger, modShortName, questContent, nextConditionData, counterElimination);
                                }
                                if (Array.isArray(subConditionData._props.weaponModsExclusive)) {
                                    parseWeaponModsExclusive(subConditionData, weaponPartsAndMods, logger, modShortName, questContent, nextConditionData, counterElimination);
                                }
                                if (Array.isArray(subConditionData._props.equipmentInclusive)) {
                                    parseEquipmentInclusive(subConditionData, equipmentLists, logger, modShortName, questContent, nextConditionData, counterElimination);
                                }
                                if (Array.isArray(subConditionData._props.equipmentExclusive)) {
                                    parseEquipmentExclusive(subConditionData, equipmentLists, logger, modShortName, questContent, nextConditionData, counterElimination);
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
                        }
                        else if (questConfigs.questsKillsCounterMultipliers.hasOwnProperty(questContent._id)) {
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
                        if (MMCQLconfig.debug.show_Quest_Ids_Set_By_Code) {
                            logger.info(`[${modShortName}] Setting \`${questContent._id}\' starting level condition id to \`${nextConditionData._props.id}\``);
                        }
                        if (questConfigs.questsLevelRequirements.hasOwnProperty(questContent._id)) {
                            nextConditionData._props.value = questConfigs.questsLevelRequirements[questContent._id];
                        }
                    }
                    else if (nextConditionData._parent == "Quest") {
                        nextConditionData._props.id = randomString;
                        if (MMCQLconfig.debug.show_Quest_Ids_Set_By_Code) {
                            logger.info(`[${modShortName}] Setting \`${questContent._id}\' quest completion check id to \`${nextConditionData._props.id}\``);
                        }
                    }
                }
                if (questsFile[quest].side == "Usec")
                    config.usecOnlyQuests.push(quest);
                if (questsFile[quest].side == "Bear")
                    config.bearOnlyQuests.push(quest);
                questsFile[quest].side = "Pmc";
                database.templates.quests[quest] = questsFile[quest];
                questCount++;
            }
        });
        logger.success(`[${modShortName}] Loaded ${questCount} custom quests.`);
    }
    parseEquipmentExclusive(subConditionData, equipmentLists, logger, modShortName, questContent, nextConditionData, counterElimination) {
        const isCorrectFormat = subConditionData._props.equipmentExclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.equipmentExclusive = subConditionData._props.equipmentExclusive.reduce((acc, equipment) => {
                // Check if the weaponMods is a key in weaponModsInclusive
                if (equipmentLists.hasOwnProperty(equipment)) {
                    const equipmentArray = equipmentLists[equipment];
                    // Concatenate each ID into a separate array
                    const separatedArrays = equipmentArray.map(equipmentId => [equipmentId]);
                    if (MMCQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${equipment}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    // Concatenate the arrays into the accumulator
                    return acc.concat(separatedArrays);
                }
                else {
                    // If not found, concatenate the original weaponId
                    return acc.concat([[equipment]]);
                }
            }, []);
            if (MMCQLconfig.debug.show_Equipment_Used_By_Each_Condition) {
                logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` excluded equipment list: ${JSON.stringify(subConditionData._props.equipmentExclusive)}`);
            }
        }
    }
    parseEquipmentInclusive(subConditionData, equipmentLists, logger, modShortName, questContent, nextConditionData, counterElimination) {
        const isCorrectFormat = subConditionData._props.equipmentInclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.equipmentInclusive = subConditionData._props.equipmentInclusive.reduce((acc, equipment) => {
                // Check if the weaponMods is a key in weaponModsInclusive
                if (equipmentLists.hasOwnProperty(equipment)) {
                    const equipmentArray = equipmentLists[equipment];
                    // Concatenate each ID into a separate array
                    const separatedArrays = equipmentArray.map(equipmentId => [equipmentId]);
                    if (MMCQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${equipment}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    // Concatenate the arrays into the accumulator
                    return acc.concat(separatedArrays);
                }
                else {
                    // If not found, concatenate the original weaponId
                    return acc.concat([[equipment]]);
                }
            }, []);
            if (MMCQLconfig.debug.show_Equipment_Used_By_Each_Condition) {
                logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` included equipment list: ${JSON.stringify(subConditionData._props.equipmentInclusive)}`);
            }
        }
    }
    parseHandoverItems(nextConditionData, weaponPartsAndMods, logger, modShortName, questContent, equipmentLists, weaponArrays) {
        nextConditionData._props.target = nextConditionData._props.target.reduce((acc, category) => {
            // Check for categories across all our categories groups
            if (weaponPartsAndMods.hasOwnProperty(category)) {
                // Concatenate the corresponding array from weaponPartsAndMods
                if (MMCQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${category}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                }
                return acc.concat(weaponPartsAndMods[category]);
            }
            else if (equipmentLists.hasOwnProperty(category)) {
                // Concatenate the corresponding array from equipmentLists
                if (MMCQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${category}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                }
                return acc.concat(equipmentLists[category]);
            }
            else if (weaponArrays.hasOwnProperty(category)) {
                // Concatenate the corresponding array from weaponArrays
                if (MMCQLconfig.debug.show_Equipment_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${category}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                }
                return acc.concat(weaponArrays[category]);
            }
            else {
                // If not found, concatenate the original id
                return acc.concat(category);
            }
        }, []);
        if (MMCQLconfig.debug.show_Equipment_Used_By_Each_Condition || MMCQLconfig.debug.show_Weapon_Mods_Used_By_Each_Condition || MMCQLconfig.debug.show_Weapons_Used_By_Each_Condition) {
            logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` items/mods/weapons/ids: ${JSON.stringify(nextConditionData._props.target)}`);
        }
    }
    parseWeapons(subConditionData, weaponArrays, logger, modShortName, questContent, nextConditionData, counterElimination) {
        subConditionData._props.weapon = subConditionData._props.weapon.reduce((acc, weaponId) => {
            // Check if the weaponId is a key in weaponArrays
            if (weaponArrays.hasOwnProperty(weaponId)) {
                // Concatenate the corresponding array from weaponArrays
                if (MMCQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                    logger.info(`[${modShortName}] replacing \`${weaponId}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                }
                return acc.concat(weaponArrays[weaponId]);
            }
            else {
                // If not found, concatenate the original weaponId
                return acc.concat(weaponId);
            }
        }, []);
        if (MMCQLconfig.debug.show_Weapons_Used_By_Each_Condition) {
            logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` required weapons: ${JSON.stringify(subConditionData._props.weapon)}`);
        }
    }
    parseWeaponModsExclusive(subConditionData, weaponPartsAndMods, logger, modShortName, questContent, nextConditionData, counterElimination) {
        const isCorrectFormat = subConditionData._props.weaponModsExclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.weaponModsExclusive = subConditionData._props.weaponModsExclusive.reduce((acc, weaponMods) => {
                // Check if the weaponMods is a key in weaponModsExclusive
                if (weaponPartsAndMods.hasOwnProperty(weaponMods)) {
                    const modsArray = weaponPartsAndMods[weaponMods];
                    // Concatenate each ID into a separate array
                    const separatedArrays = modsArray.map(modId => [modId]);
                    if (MMCQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${weaponMods}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    // Concatenate the arrays into the accumulator
                    return acc.concat(separatedArrays);
                }
                else {
                    // If not found, concatenate the original weaponId
                    return acc.concat([[weaponMods]]);
                }
            }, []);
            if (MMCQLconfig.debug.show_Weapon_Mods_Used_By_Each_Condition) {
                logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` excluded weapon mods: ${JSON.stringify(subConditionData._props.weaponModsInclusive)}`);
            }
        }
    }
    parseWeaponModsInclusive(subConditionData, weaponPartsAndMods, logger, modShortName, questContent, nextConditionData, counterElimination) {
        const isCorrectFormat = subConditionData._props.weaponModsInclusive.every(Array.isArray);
        if (!isCorrectFormat) {
            subConditionData._props.weaponModsInclusive = subConditionData._props.weaponModsInclusive.reduce((acc, weaponMods) => {
                if (weaponPartsAndMods.hasOwnProperty(weaponMods)) {
                    const modsArray = weaponPartsAndMods[weaponMods];
                    const separatedArrays = modsArray.map(modId => [modId]);
                    if (MMCQLconfig.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                        logger.info(`[${modShortName}] replacing \`${weaponMods}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                    }
                    return acc.concat(separatedArrays);
                }
                else {
                    return acc.concat([[weaponMods]]);
                }
            }, []);
        }
        if (MMCQLconfig.debug.show_Weapon_Mods_Used_By_Each_Condition) {
            logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` included weapon mods: ${JSON.stringify(subConditionData._props.weaponModsInclusive)}`);
        }
    }
    importLocales(database) {
        const serverLocales = ['ch', 'cz', 'en', 'es', 'es-mx', 'fr', 'ge', 'hu', 'it', 'jp', 'pl', 'po', 'ru', 'sk', 'tu'];
        const addedLocales = {};
        for (const locale of serverLocales) {
            this.loadFiles(`${modPath}/database/locales/${locale}`, [".json"], function (filePath) {
                const localeFile = require(filePath);
                if (Object.keys(localeFile).length < 1)
                    return;
                for (const currentItem in localeFile) {
                    database.locales.global[locale][currentItem] = localeFile[currentItem];
                    if (!Object.keys(addedLocales).includes(locale))
                        addedLocales[locale] = {};
                    addedLocales[locale][currentItem] = localeFile[currentItem];
                }
            });
        }
        // placeholders
        for (const locale of serverLocales) {
            if (locale == "en")
                continue;
            for (const englishItem in addedLocales["en"]) {
                if (locale in addedLocales) {
                    if (englishItem in addedLocales[locale])
                        continue;
                }
                if (database.locales.global[locale] != undefined)
                    database.locales.global[locale][englishItem] = addedLocales["en"][englishItem];
            }
        }
    }
    routeImages(imageRouter) {
        let imageCount = 0;
        this.loadFiles(`${modPath}/res/quests/`, [".png", ".jpg"], function (filePath) {
            imageRouter.addRoute(`/files/quest/icon/${path.basename(filePath, path.extname(filePath))}`, filePath);
            imageCount++;
        });
        this.logger.success(`[${this.modShortName}] Loaded ${imageCount} custom images.`);
    }
}
module.exports = { mod: new VCQL() };
//# sourceMappingURL=mod.js.map