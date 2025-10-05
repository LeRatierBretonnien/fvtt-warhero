import { WarheroUtility } from "./warhero-utility.js";

/**
 * Warhero Party Sheet Application v2
 * Extends the basic ApplicationV2 with party-specific functionality
 * @extends {foundry.applications.sheets.ActorSheetV2}
 */
export class WarheroPartySheetV2 extends foundry.applications.sheets.ActorSheetV2 {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["fvtt-warhero", "sheet", "actor", "party"],
    tag: "form",
    form: {
      handler: WarheroPartySheetV2.#onSubmitForm,
      submitOnChange: true
    },
    position: {
      width: 800,
      height: 600,
      resizable: true
    },
    window: {
      icon: "fas fa-users",
      resizable: true
    },
    actions: {
      "add-member": WarheroPartySheetV2.#onAddMember,
      "remove-member": WarheroPartySheetV2.#onRemoveMember,
      "edit-member": WarheroPartySheetV2.#onEditMember,
      "roll-party-skill": WarheroPartySheetV2.#onRollPartySkill,
      "show-member-image": WarheroPartySheetV2.#onShowMemberImage,
      "manage-party": WarheroPartySheetV2.#onManageParty,
      "rest-party": WarheroPartySheetV2.#onRestParty,
      "distribute-xp": WarheroPartySheetV2.#onDistributeXP,
      "show-image": WarheroPartySheetV2.#onShowImage
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: "systems/fvtt-warhero/templates/party-sheet-header.html",
      templates: []
    },
    tabs: {
      template: "systems/fvtt-warhero/templates/party-sheet-tabs.html",
      templates: []
    },
    members: {
      template: "systems/fvtt-warhero/templates/party-sheet-members.html",
      templates: []
    },
    inventory: {
      template: "systems/fvtt-warhero/templates/party-sheet-inventory.html",
      templates: []
    },
    notes: {
      template: "systems/fvtt-warhero/templates/party-sheet-notes.html",
      templates: []
    },
    footer: {
      template: "systems/fvtt-warhero/templates/party-sheet-footer.html",
      templates: []
    }
  };

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /** @override */
  get title() {
    const type = game.i18n.localize(`TYPES.Actor.${this.document.type}`);
    const memberCount = this.document.system.members?.length || 0;
    return `${this.document.name} - ${type} (${memberCount} members)`;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const doc = this.document;
    const src = doc.toObject();
    const rollData = doc.getRollData();

    // Enrich HTML content
    const enrichmentOptions = {
      rollData: rollData,
      secrets: doc.isOwner,
      async: true
    };

    const context = {
      // Document data
      document: doc,
      actor: doc,
      source: src,
      system: doc.system,

      // Basic sheet data
      name: doc.name,
      img: doc.img,
      type: doc.type,
      id: doc.id,

      // Sheet configuration
      isOwner: doc.isOwner,
      isEditable: this.isEditable,
      limited: doc.limited,

      // System configuration
      config: game.system.warhero.config,

      // Enriched content
      description: await TextEditor.enrichHTML(src.system.description || "", enrichmentOptions),
      notes: await TextEditor.enrichHTML(src.system.notes || "", enrichmentOptions),
      gmnotes: await TextEditor.enrichHTML(src.system.gmnotes || "", enrichmentOptions),

      // Roll data
      rollData: rollData,

      // Utility flags
      isGM: game.user.isGM,
      cssClass: this.isEditable ? "editable" : "locked",
      editScore: this.isEditable,

      // Tab data
      tabs: this._getTabs(),

      // Party-specific data
      ...await this._preparePartyData(doc, src, rollData)
    };

    console.log("PARTY SHEET V2 CONTEXT:", context);
    return context;
  }

  /**
   * Get tab configuration for this actor type
   * @returns {Object[]} Tab configuration array
   * @private
   */
  _getTabs() {
    return [
      {
        id: "members",
        group: "primary",
        label: "WH.ui.members",
        icon: "fas fa-users",
        active: true
      },
      {
        id: "inventory",
        group: "primary",
        label: "WH.ui.inventory",
        icon: "fas fa-chest",
        active: false
      },
      {
        id: "notes",
        group: "primary",
        label: "WH.ui.notes",
        icon: "fas fa-scroll",
        active: false
      }
    ];
  }

  /**
   * Prepare party-specific context data
   * @param {WarheroActor} doc - The actor document
   * @param {Object} src - The source data
   * @param {Object} rollData - Roll data
   * @returns {Object} Party-specific context
   * @private
   */
  async _preparePartyData(doc, src, rollData) {
    const context = {};

    // Get party members
    context.members = await this._preparePartyMembers(doc);
    context.memberCount = context.members.length;

    // Get party inventory
    context.inventory = await this._preparePartyInventory(doc);

    // Get party statistics
    context.stats = this._preparePartyStats(doc, context.members);

    // Get available party slots
    context.availableActors = this._getAvailableActors(context.members);

    return context;
  }

  /**
   * Prepare party member data
   * @param {WarheroActor} doc - The party actor document
   * @returns {Array} Array of party member data
   * @private
   */
  async _preparePartyMembers(doc) {
    const members = [];
    const memberIds = doc.system.members || [];

    for (const memberId of memberIds) {
      const memberActor = game.actors.get(memberId);
      if (memberActor) {
        const memberData = {
          id: memberActor.id,
          actor: memberActor,
          name: memberActor.name,
          img: memberActor.img,
          type: memberActor.type,
          level: memberActor.system.secondary?.level || 1,
          hp: memberActor.system.attributes?.hp || { value: 0, max: 0 },
          mana: memberActor.system.attributes?.mana || { value: 0, max: 0 },
          race: memberActor.getRace?.()?.name || "Unknown",
          classes: memberActor.getClasses?.()?.map(c => c.name).join(", ") || "None",
          isOwner: memberActor.isOwner,
          canEdit: memberActor.canUserModify(game.user, "update")
        };

        // Add status conditions
        memberData.conditions = this._getMemberConditions(memberActor);

        members.push(memberData);
      }
    }

    return members;
  }

  /**
   * Get member status conditions
   * @param {WarheroActor} actor - The member actor
   * @returns {Array} Array of condition data
   * @private
   */
  _getMemberConditions(actor) {
    const conditions = [];

    // Check for common conditions
    if (actor.system.attributes?.hp?.value <= 0) {
      conditions.push({
        name: "Unconscious",
        icon: "fas fa-skull",
        severity: "critical"
      });
    } else if (actor.system.attributes?.hp?.value < actor.system.attributes?.hp?.max / 4) {
      conditions.push({
        name: "Wounded",
        icon: "fas fa-bandage",
        severity: "warning"
      });
    }

    if (actor.system.attributes?.mana?.value <= 0) {
      conditions.push({
        name: "Exhausted",
        icon: "fas fa-battery-empty",
        severity: "warning"
      });
    }

    return conditions;
  }

  /**
   * Prepare party inventory data
   * @param {WarheroActor} doc - The party actor document
   * @returns {Object} Party inventory data
   * @private
   */
  async _preparePartyInventory(doc) {
    const inventory = {
      equipment: doc.items.filter(i => i.type === "equipment"),
      weapons: doc.items.filter(i => i.type === "weapon"),
      armors: doc.items.filter(i => i.type === "armor"),
      money: doc.items.filter(i => i.type === "money"),
      other: doc.items.filter(i => !["equipment", "weapon", "armor", "money"].includes(i.type))
    };

    // Calculate total value
    inventory.totalValue = doc.computeTotalMoney?.() || 0;

    return inventory;
  }

  /**
   * Prepare party statistics
   * @param {WarheroActor} doc - The party actor document
   * @param {Array} members - Array of party members
   * @returns {Object} Party statistics
   * @private
   */
  _preparePartyStats(doc, members) {
    const stats = {
      totalLevel: 0,
      averageLevel: 0,
      totalHP: 0,
      currentHP: 0,
      totalMana: 0,
      currentMana: 0,
      memberCount: members.length
    };

    for (const member of members) {
      stats.totalLevel += member.level;
      stats.totalHP += member.hp.max;
      stats.currentHP += member.hp.value;
      stats.totalMana += member.mana.max;
      stats.currentMana += member.mana.value;
    }

    if (members.length > 0) {
      stats.averageLevel = Math.round(stats.totalLevel / members.length);
    }

    stats.hpPercentage = stats.totalHP > 0 ? Math.round((stats.currentHP / stats.totalHP) * 100) : 0;
    stats.manaPercentage = stats.totalMana > 0 ? Math.round((stats.currentMana / stats.totalMana) * 100) : 0;

    return stats;
  }

  /**
   * Get actors available to add to the party
   * @param {Array} currentMembers - Current party members
   * @returns {Array} Available actors
   * @private
   */
  _getAvailableActors(currentMembers) {
    const currentMemberIds = currentMembers.map(m => m.id);
    return game.actors.filter(actor =>
      actor.type === "character" &&
      !currentMemberIds.includes(actor.id) &&
      actor.isOwner
    );
  }

  /* -------------------------------------------- */
  /*  Event Handlers                             */
  /* -------------------------------------------- */

  /**
   * Handle form submission
   * @param {SubmitEvent} event - The form submission event
   * @param {HTMLFormElement} form - The form element
   * @param {FormDataExtended} formData - The form data
   */
  static async #onSubmitForm(event, form, formData) {
    const doc = this.document;

    // Process form data
    const updateData = this._processFormData(formData);

    // Update the document
    await doc.update(updateData);
  }

  /**
   * Process form data for submission
   * @param {FormDataExtended} formData - The form data
   * @returns {Object} Processed update data
   * @private
   */
  _processFormData(formData) {
    const updateData = foundry.utils.expandObject(formData.object);
    return updateData;
  }

  /**
   * Handle adding a member to the party
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onAddMember(event, target) {
    event.preventDefault();

    const actorId = target.dataset.actorId;
    if (!actorId) {
      // Show actor selection dialog
      const availableActors = game.actors.filter(a =>
        a.type === "character" && a.isOwner
      );

      if (availableActors.length === 0) {
        ui.notifications.warn("No available characters to add to party.");
        return;
      }

      // Create selection dialog
      const options = availableActors.map(actor =>
        `<option value="${actor.id}">${actor.name}</option>`
      ).join("");

      const content = `
        <div class="form-group">
          <label>Select Character:</label>
          <select name="actorId">${options}</select>
        </div>
      `;

      const selectedId = await Dialog.prompt({
        title: "Add Party Member",
        content: content,
        callback: (html) => html.find('[name="actorId"]').val()
      });

      if (selectedId) {
        await this._addMemberToParty(selectedId);
      }
    } else {
      await this._addMemberToParty(actorId);
    }
  }

  /**
   * Add a member to the party
   * @param {string} actorId - The actor ID to add
   * @private
   */
  async _addMemberToParty(actorId) {
    const doc = this.document;
    const currentMembers = doc.system.members || [];

    if (currentMembers.includes(actorId)) {
      ui.notifications.warn("Character is already in the party.");
      return;
    }

    const newMembers = [...currentMembers, actorId];
    await doc.update({ "system.members": newMembers });

    const actor = game.actors.get(actorId);
    ui.notifications.info(`${actor?.name} added to the party.`);
  }

  /**
   * Handle removing a member from the party
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onRemoveMember(event, target) {
    event.preventDefault();

    const memberId = target.dataset.memberId;
    if (!memberId) return;

    const member = game.actors.get(memberId);
    if (!member) return;

    const confirmed = await Dialog.confirm({
      title: "Remove Party Member",
      content: `Remove ${member.name} from the party?`,
      yes: () => true,
      no: () => false
    });

    if (confirmed) {
      const doc = this.document;
      const currentMembers = doc.system.members || [];
      const newMembers = currentMembers.filter(id => id !== memberId);

      await doc.update({ "system.members": newMembers });
      ui.notifications.info(`${member.name} removed from the party.`);
    }
  }

  /**
   * Handle editing a party member
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onEditMember(event, target) {
    event.preventDefault();

    const memberId = target.dataset.memberId;
    if (!memberId) return;

    const member = game.actors.get(memberId);
    if (member) {
      member.sheet.render(true);
    }
  }

  /**
   * Handle rolling a party skill check
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onRollPartySkill(event, target) {
    event.preventDefault();

    const skillName = target.dataset.skill;
    if (!skillName) return;

    const doc = this.document;
    const members = doc.system.members || [];

    if (members.length === 0) {
      ui.notifications.warn("No party members to roll for.");
      return;
    }

    const rolls = [];
    for (const memberId of members) {
      const member = game.actors.get(memberId);
      if (member && member.rollSkill) {
        const roll = await member.rollSkill(skillName, { silent: true });
        if (roll) {
          rolls.push({
            actor: member.name,
            result: roll.total
          });
        }
      }
    }

    // Create combined message
    const content = rolls.map(r => `${r.actor}: ${r.result}`).join("<br>");
    ChatMessage.create({
      speaker: { alias: doc.name },
      content: `<h3>Party ${skillName} Check</h3>${content}`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }

  /**
   * Handle showing member image
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onShowMemberImage(event, target) {
    event.preventDefault();

    const memberId = target.dataset.memberId;
    if (!memberId) return;

    const member = game.actors.get(memberId);
    if (member) {
      new ImagePopout(member.img, {
        title: member.name,
        uuid: member.uuid
      }).render(true);
    }
  }

  /**
   * Handle party management actions
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onManageParty(event, target) {
    event.preventDefault();

    const action = target.dataset.action;
    const doc = this.document;

    switch (action) {
      case "heal-all":
        await this._healAllMembers(doc);
        break;
      case "restore-mana":
        await this._restoreAllMana(doc);
        break;
      case "full-restore":
        await this._fullRestoreAll(doc);
        break;
    }
  }

  /**
   * Heal all party members
   * @param {WarheroActor} doc - The party actor
   * @private
   */
  async _healAllMembers(doc) {
    const members = doc.system.members || [];
    let healed = 0;

    for (const memberId of members) {
      const member = game.actors.get(memberId);
      if (member && member.system.attributes?.hp) {
        const currentHP = member.system.attributes.hp.value;
        const maxHP = member.system.attributes.hp.max;

        if (currentHP < maxHP) {
          await member.update({ "system.attributes.hp.value": maxHP });
          healed++;
        }
      }
    }

    if (healed > 0) {
      ui.notifications.info(`Healed ${healed} party members.`);
    } else {
      ui.notifications.info("All party members are already at full health.");
    }
  }

  /**
   * Restore mana for all party members
   * @param {WarheroActor} doc - The party actor
   * @private
   */
  async _restoreAllMana(doc) {
    const members = doc.system.members || [];
    let restored = 0;

    for (const memberId of members) {
      const member = game.actors.get(memberId);
      if (member && member.system.attributes?.mana) {
        const currentMana = member.system.attributes.mana.value;
        const maxMana = member.system.attributes.mana.max;

        if (currentMana < maxMana) {
          await member.update({ "system.attributes.mana.value": maxMana });
          restored++;
        }
      }
    }

    if (restored > 0) {
      ui.notifications.info(`Restored mana for ${restored} party members.`);
    } else {
      ui.notifications.info("All party members are already at full mana.");
    }
  }

  /**
   * Full restore for all party members
   * @param {WarheroActor} doc - The party actor
   * @private
   */
  async _fullRestoreAll(doc) {
    await this._healAllMembers(doc);
    await this._restoreAllMana(doc);
  }

  /**
   * Handle party rest
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onRestParty(event, target) {
    event.preventDefault();

    const restType = target.dataset.restType || "short";
    const doc = this.document;
    const members = doc.system.members || [];

    for (const memberId of members) {
      const member = game.actors.get(memberId);
      if (member && member.system.rest) {
        await member.system.rest(restType);
      }
    }

    ui.notifications.info(`Party took a ${restType} rest.`);
  }

  /**
   * Handle XP distribution
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onDistributeXP(event, target) {
    event.preventDefault();

    const content = `
      <div class="form-group">
        <label>XP Amount:</label>
        <input type="number" name="xpAmount" value="100" min="0">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" name="divideBetweenMembers" checked>
          Divide between all members
        </label>
      </div>
    `;

    new Dialog({
      title: "Distribute Experience Points",
      content: content,
      buttons: {
        distribute: {
          label: "Distribute",
          callback: async (html) => {
            const xpAmount = parseInt(html.find('[name="xpAmount"]').val()) || 0;
            const divide = html.find('[name="divideBetweenMembers"]').prop("checked");

            await this._distributeXP(xpAmount, divide);
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "distribute"
    }).render(true);
  }

  /**
   * Distribute XP to party members
   * @param {number} totalXP - Total XP to distribute
   * @param {boolean} divide - Whether to divide between members
   * @private
   */
  async _distributeXP(totalXP, divide) {
    const doc = this.document;
    const members = doc.system.members || [];

    if (members.length === 0) {
      ui.notifications.warn("No party members to distribute XP to.");
      return;
    }

    const xpPerMember = divide ? Math.floor(totalXP / members.length) : totalXP;

    for (const memberId of members) {
      const member = game.actors.get(memberId);
      if (member && member.system.secondary?.xp) {
        const currentXP = member.system.secondary.xp.value || 0;
        await member.update({ "system.secondary.xp.value": currentXP + xpPerMember });
      }
    }

    ui.notifications.info(`Distributed ${xpPerMember} XP to each party member.`);
  }

  /**
   * Handle showing party image
   * @param {Event} event - The triggering event
   * @param {HTMLElement} target - The target element
   */
  static async #onShowImage(event, target) {
    event.preventDefault();

    const doc = this.document;
    new ImagePopout(doc.img, {
      title: doc.name,
      uuid: doc.uuid
    }).render(true);
  }

  /* -------------------------------------------- */
  /*  Drag and Drop                              */
  /* -------------------------------------------- */

  /** @override */
  _canDragStart(selector) {
    return this.isEditable;
  }

  /** @override */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /** @override */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    // Handle dropping actors to add as party members
    if (data.type === "Actor") {
      return this._onDropActor(event, data);
    }

    // Handle dropping items to add to party inventory
    if (data.type === "Item") {
      return this._onDropItem(event, data);
    }

    return super._onDrop(event);
  }

  /**
   * Handle dropping an actor on the party sheet
   * @param {DragEvent} event - The drag event
   * @param {Object} data - The drop data
   * @private
   */
  async _onDropActor(event, data) {
    if (!this.isEditable) return;

    const actor = await Actor.implementation.fromDropData(data);
    if (!actor || actor.type !== "character") {
      ui.notifications.warn("Only character actors can be added to a party.");
      return;
    }

    await this._addMemberToParty(actor.id);
  }

  /**
   * Handle dropping an item on the party sheet
   * @param {DragEvent} event - The drag event
   * @param {Object} data - The drop data
   * @private
   */
  async _onDropItem(event, data) {
    if (!this.isEditable) return;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return;

    // Create a copy of the item in the party inventory
    const itemData = item.toObject();
    delete itemData._id;

    await Item.create(itemData, { parent: this.document });
    ui.notifications.info(`${item.name} added to party inventory.`);
  }
}