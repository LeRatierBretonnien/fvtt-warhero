/**
 * Warhero Party Data Model
 * Defines the data schema for party actors using Foundry DataModel API
 */

const fields = foundry.data.fields;

/**
 * Data model class for party actors
 * @extends foundry.abstract.TypeDataModel
 */
export class PartyData extends foundry.abstract.TypeDataModel {

  /**
   * Define the data schema for party actors
   * @returns {Object} The data schema definition
   */
  static defineSchema() {
    return {
      // Biographical data (inherited from template)
      biodata: new fields.SchemaField({
        class: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.partytype",
          hint: "WH.ui.partytype.hint"
        }),
        age: new fields.NumberField({
          initial: 0,
          required: false,
          min: 0,
          integer: true,
          label: "WH.ui.founded",
          hint: "WH.ui.founded.hint"
        }),
        size: new fields.StringField({
          initial: "medium",
          required: false,
          blank: false,
          choices: {
            "small": "WH.ui.small",
            "medium": "WH.ui.medium",
            "large": "WH.ui.large",
            "huge": "WH.ui.huge"
          },
          label: "WH.ui.partysize",
          hint: "WH.ui.partysize.hint"
        }),
        weight: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.totalweight",
          hint: "WH.ui.totalweight.hint"
        }),
        height: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.territory",
          hint: "WH.ui.territory.hint"
        }),
        hair: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.colors",
          hint: "WH.ui.colors.hint"
        }),
        sex: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.alignment",
          hint: "WH.ui.alignment.hint"
        }),
        eyes: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.reputation",
          hint: "WH.ui.reputation.hint"
        }),
        background: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.background",
          hint: "WH.ui.background.hint"
        }),
        religion: new fields.StringField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.patron",
          hint: "WH.ui.patron.hint"
        }),
        description: new fields.HTMLField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.description",
          hint: "WH.ui.description.hint"
        }),
        notes: new fields.HTMLField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.notes",
          hint: "WH.ui.notes.hint"
        }),
        gmnotes: new fields.HTMLField({
          initial: "",
          required: false,
          blank: true,
          label: "WH.ui.gmnotes",
          hint: "WH.ui.gmnotes.hint"
        })
      }, {
        label: "WH.ui.partyinfo",
        hint: "WH.ui.partyinfo.hint"
      }),

      // Party members
      members: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ required: false }),
          name: new fields.StringField({ required: false }),
          role: new fields.StringField({
            required: false,
            choices: {
              "leader": "WH.ui.leader",
              "member": "WH.ui.member",
              "companion": "WH.ui.companion",
              "hireling": "WH.ui.hireling"
            }
          }),
          active: new fields.BooleanField({ initial: true, required: false })
        }),
        {
          initial: [],
          required: false,
          label: "WH.ui.members",
          hint: "WH.ui.members.hint"
        }
      ),

      // Party resources
      resources: new fields.SchemaField({
        money: new fields.SchemaField({
          copper: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true }),
          silver: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true }),
          gold: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true }),
          platinum: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true })
        }, {
          label: "WH.ui.partymoney",
          hint: "WH.ui.partymoney.hint"
        }),
        supplies: new fields.SchemaField({
          food: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true }),
          water: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true }),
          ammunition: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true }),
          torches: new fields.NumberField({ initial: 0, required: false, min: 0, integer: true })
        }, {
          label: "WH.ui.supplies",
          hint: "WH.ui.supplies.hint"
        })
      }, {
        label: "WH.ui.resources",
        hint: "WH.ui.resources.hint"
      }),

      // Party settings
      settings: new fields.SchemaField({
        shareResources: new fields.BooleanField({
          initial: true,
          required: false,
          label: "WH.ui.shareresources",
          hint: "WH.ui.shareresources.hint"
        }),
        shareExperience: new fields.BooleanField({
          initial: true,
          required: false,
          label: "WH.ui.shareexperience",
          hint: "WH.ui.shareexperience.hint"
        }),
        autoRest: new fields.BooleanField({
          initial: false,
          required: false,
          label: "WH.ui.autorest",
          hint: "WH.ui.autorest.hint"
        }),
        combatOrder: new fields.StringField({
          initial: "initiative",
          required: false,
          choices: {
            "initiative": "WH.ui.initiative",
            "dexterity": "WH.ui.dexterity",
            "custom": "WH.ui.custom"
          },
          label: "WH.ui.combatorder",
          hint: "WH.ui.combatorder.hint"
        })
      }, {
        label: "WH.ui.partysettings",
        hint: "WH.ui.partysettings.hint"
      })
    };
  }

  /**
   * Prepare base data for the party
   */
  prepareBaseData() {
    super.prepareBaseData();

    // Ensure all numeric values are valid
    this.biodata.age = Math.max(0, this.biodata.age);

    // Resources
    for (let currency of Object.values(this.resources.money)) {
      if (typeof currency === 'number') {
        currency = Math.max(0, currency);
      }
    }

    for (let supply of Object.values(this.resources.supplies)) {
      if (typeof supply === 'number') {
        supply = Math.max(0, supply);
      }
    }
  }

  /**
   * Prepare derived data for the party
   */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Calculate party statistics
    this._calculatePartyStats();

    // Calculate resource totals
    this._calculateResourceTotals();

    // Update member information
    this._updateMemberInfo();
  }

  /**
   * Calculate party statistics from members
   * @private
   */
  _calculatePartyStats() {
    const activeMembers = this.members.filter(m => m.active);

    this.memberCount = activeMembers.length;
    this.totalMembers = this.members.length;
    this.hasLeader = activeMembers.some(m => m.role === "leader");

    // Calculate average party level (would need to access actual actors)
    this.averageLevel = 1; // Placeholder
  }

  /**
   * Calculate resource totals
   * @private
   */
  _calculateResourceTotals() {
    // Money totals (convert to copper for easy calculation)
    this.totalWealthInCopper =
      this.resources.money.copper +
      (this.resources.money.silver * 10) +
      (this.resources.money.gold * 100) +
      (this.resources.money.platinum * 1000);

    this.totalWealthInGold = this.totalWealthInCopper / 100;

    // Supply totals
    this.totalSupplies =
      this.resources.supplies.food +
      this.resources.supplies.water +
      this.resources.supplies.ammunition +
      this.resources.supplies.torches;

    // Days of food/water available
    this.daysOfFood = this.memberCount > 0 ?
      Math.floor(this.resources.supplies.food / this.memberCount) : 0;
    this.daysOfWater = this.memberCount > 0 ?
      Math.floor(this.resources.supplies.water / this.memberCount) : 0;
  }

  /**
   * Update member information from actual actors
   * @private
   */
  _updateMemberInfo() {
    // This would typically sync with actual Actor documents
    // For now, we just ensure data consistency

    this.activeMemberIds = this.members
      .filter(m => m.active)
      .map(m => m.id)
      .filter(id => id);
  }

  /**
   * Validate party data
   */
  validateJoint(options = {}) {
    super.validateJoint(options);

    // Ensure at least one leader exists if there are members
    if (this.members.length > 0) {
      const leaders = this.members.filter(m => m.role === "leader" && m.active);
      if (leaders.length === 0) {
        console.warn("Party has no active leader");
      }
    }
  }

  /**
   * Migrate party data
   */
  static migrateData(data) {
    return super.migrateData(data);
  }

  /**
   * Add a member to the party
   */
  async addMember(actorId, role = "member") {
    const actor = game.actors.get(actorId);
    if (!actor) return false;

    const newMember = {
      id: actorId,
      name: actor.name,
      role: role,
      active: true
    };

    const updateData = {
      "system.members": [...this.members, newMember]
    };

    await this.parent.update(updateData);
    return true;
  }

  /**
   * Remove a member from the party
   */
  async removeMember(actorId) {
    const updateData = {
      "system.members": this.members.filter(m => m.id !== actorId)
    };

    await this.parent.update(updateData);
    return true;
  }

  /**
   * Update member role
   */
  async updateMemberRole(actorId, newRole) {
    const memberIndex = this.members.findIndex(m => m.id === actorId);
    if (memberIndex === -1) return false;

    const members = [...this.members];
    members[memberIndex].role = newRole;

    const updateData = {
      "system.members": members
    };

    await this.parent.update(updateData);
    return true;
  }

  /**
   * Toggle member active status
   */
  async toggleMemberActive(actorId) {
    const memberIndex = this.members.findIndex(m => m.id === actorId);
    if (memberIndex === -1) return false;

    const members = [...this.members];
    members[memberIndex].active = !members[memberIndex].active;

    const updateData = {
      "system.members": members
    };

    await this.parent.update(updateData);
    return true;
  }

  /**
   * Distribute money to all active members
   */
  async distributeMoney(amount, currency = "gold") {
    if (amount <= 0 || this.memberCount === 0) return false;

    const availableAmount = this.resources.money[currency];
    if (availableAmount < amount) return false;

    const amountPerMember = Math.floor(amount / this.memberCount);
    const remainder = amount % this.memberCount;

    // Update party resources
    const updateData = {
      [`system.resources.money.${currency}`]: availableAmount - amount
    };

    await this.parent.update(updateData);

    // Distribute to members (would need to update individual actors)
    // This is a placeholder for the actual distribution logic

    return { amountPerMember, remainder };
  }

  /**
   * Add resources to party
   */
  async addResources(type, subtype, amount) {
    if (amount <= 0) return false;

    const currentAmount = this.resources[type][subtype];
    const updateData = {
      [`system.resources.${type}.${subtype}`]: currentAmount + amount
    };

    await this.parent.update(updateData);
    return true;
  }

  /**
   * Consume resources (food, water, etc.)
   */
  async consumeSupplies(days = 1) {
    if (this.memberCount === 0) return false;

    const foodNeeded = this.memberCount * days;
    const waterNeeded = this.memberCount * days;

    if (this.resources.supplies.food < foodNeeded ||
      this.resources.supplies.water < waterNeeded) {
      return false; // Not enough supplies
    }

    const updateData = {
      "system.resources.supplies.food": this.resources.supplies.food - foodNeeded,
      "system.resources.supplies.water": this.resources.supplies.water - waterNeeded
    };

    await this.parent.update(updateData);
    return true;
  }

  /**
   * Rest the entire party
   */
  async partyRest(type = "short") {
    if (!this.settings.autoRest) return false;

    // Get all active party member actors
    const memberActors = this.activeMemberIds
      .map(id => game.actors.get(id))
      .filter(actor => actor);

    // Rest each member
    for (let actor of memberActors) {
      if (actor.system.rest) {
        await actor.system.rest(type);
      }
    }

    // Consume supplies for long rest
    if (type === "long") {
      await this.consumeSupplies(1);
    }

    return true;
  }
}