import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';
import { Building } from 'src/app/models/building.model';
import { Description } from 'src/app/models/description.model';
import { PbScope } from 'src/app/models/pb-scope.model';
import { Project } from 'src/app/models/project.model';
import { PsbMeasures } from 'src/app/models/psb-measures.model';
import { DeleteComponent } from 'src/app/prospecting/modals/delete/delete.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { ProjectsService } from 'src/app/services/projects.service';
import { ProposalDescriptionsService } from 'src/app/services/proposal-descriptions.service';

@Component({
  selector: 'app-scope-edit-modal',
  templateUrl: './scope-edit-modal.component.html',
  styleUrls: ['./scope-edit-modal.component.scss']
})
export class ScopeEditModalComponent implements OnInit {
  @Input() building: Building;
  @Input() isArchitectural: boolean;
  @Input() project: Project;
  scope: PbScope;
  descriptions: Description[];
  text: string = '';
  readonly removeLineKey = '-1';

  constructor(
    private projectService: ProjectsService,
    private descriptionsService: ProposalDescriptionsService,
    private modalController: ModalController,
    private catalogService: CatalogsService,
    private general: GeneralService
  ) { }

  ngOnInit() {
    this.loadScope();
  }

  /**
   * Change ownership if verified
   * @param event
   * @param idScope
   */
  async onVerifiedClick(event, idScope) {
    if (!this.text) {
      await this.getDescriptions();
    }

    const scopes = this.building.pb_scopes.map(x => {
      if (x.id == idScope) {
        return {
          ...x,
          is_verified: !event,
          is_modified: true,
          isModified: true,
          scope_of_work: this.text
        };
      } else {
        return { ...x };
      }
    });

    this.building = { ...this.building, pb_scopes: scopes };
    this.projectService.saveProjectBuilding(this.building);
    this.loadScope();
  }
  /**
   * Load init data scope
   */
  loadScope() {
    this.scope = this.building.pb_scopes.find(
      x => x.is_architectural == this.isArchitectural
    );

    if (!this.scope.scope_of_work) {
      this.getDescriptions().then(() => {
        this.updateSWText(this.scope.id);
      });
    } else {
      this.text = this.scope.scope_of_work;
    }
  }

  updateSWText(idScope) {
    const scopes = this.building.pb_scopes.map(x => {
      if (x.id == idScope) {
        return {
          ...x,
          scope_of_work: this.text
        };
      } else {
        return { ...x };
      }
    });

    this.building = { ...this.building, pb_scopes: scopes };
    this.projectService.saveProjectBuilding(this.building);
  }

  /**
   *
   */
  async getDescriptions() {
    this.text = '';
    await this.descriptionsService.get().then(async result => {
      if (this.isArchitectural) {
        this.descriptions = result.data
          .filter(x => x.is_architectural == true)
          .sort((a, b) => a.order - b.order);
      } else {
        this.descriptions = result.data
          .filter(x => x.is_presidential == true)
          .sort((a, b) => a.order - b.order);
      }

      await this.textAppendTags();
    });
  }

  textAppendOptions() {
    if (this.building?.psb_measure?.psb_options?.filter(x => x.is_built_in && x?.deletedAt == null)?.length > 0) {
      this.building.psb_measure.psb_options
        .filter(x => x.is_built_in)
        .forEach(option => {
          this.text += `- ${option.option} \n`;
        });
    }
  }

  async textAppendTags() {
    for (const element of this.descriptions) {
      if (element.description.includes('[skyLight')) {
        const skyDescription = (await this.skylightBindData(element.description)).trim();
        if (skyDescription?.length > 0) {
          this.text += skyDescription + ' \n';
        }
      } else if (element.description == '[options]') {
        this.textAppendOptions();
      }
      else {
        const descriptionWithValues = (
          await this.bindScopeData(element.description)
        ).trim();
        if (descriptionWithValues?.length > 0) {
          this.text += '- ' + descriptionWithValues?.replace('\\n', '\n') + ' \n';
        }
      }
    }
  }

  async skylightBindData(format: string) {
    if (format.includes('[isTearOff]')) {
      if ((await this.isTearOff()) == this.removeLineKey)
        return '';
      else
        format = format.replace('[isTearOff]', '')
    }

    if (format.includes('[isNewConstruction]')) {
      if ((await this.isNewConstruction()) == this.removeLineKey)
        return '';
      else
        format = format.replace('[isNewConstruction]', '')
    }

    if (format.includes('[isOverlay]')) {
      if ((await this.isOverlay()) == this.removeLineKey)
        return '';
      else
        format = format.replace('[isOverlay]', '')
    }

    if (format.includes('[skyLightDeclined]')) {
      return this.allSkylightDeclined(format.replace('[skyLightDeclined]', ''));
    } else if (format.includes('[skyLightHomeOwner]')) {
      return this.allSkylightHomeOwner(format.replace('[skyLightHomeOwner]', ''));
    } else if (format.includes('[skyLightUs]')) {
      return this.allSkylightUs(format.replace('[skyLightUs]', ''));
    } else if (format.includes('[skyLightDeclinedReuse]')) {
      return this.allSkylightDeclinedReuse(format.replace('[skyLightDeclinedReuse]', ''));
    } else if (format.includes('[skyLightHomeOwnerReuse]')) {
      return this.allSkylightHomeOwnerReuse(
        format.replace('[skyLightHomeOwnerReuse]', '')
      );
    } else if (format.includes('[skyLightUsReuse]')) {
      return this.allSkylightUsReuse(format.replace('[skyLightUsReuse]', ''));
    }
    return '';
  }

  allSkylightDeclined(format: string) {
    return this.allSkylight(format, 1);
  }

  allSkylightUs(format: string) {
    return this.allSkylight(format, 2);
  }

  allSkylightHomeOwner(format: string) {
    return this.allSkylight(format, 3);
  }
  allSkylight(format: string, typeId: number) {
    const skylights =
      this.building?.psb_measure?.psb_skylights
        ?.filter(x => x.id_fkit_option == typeId && x.need_replace == true)
        .map(x => {
          switch (x.id_skylight_size) {
            case 1:
              return (
                '- ' +
                format.replace('[width]', '22.5').replace('[lenght]', '22.5').trim()
              );
            case 2:
              return (
                '- ' +
                format.replace('[width]', '22.5').replace('[lenght]', '46.5').trim()
              );
            default:
              return this.removeLineKey;
          }
        })
        ?.filter(x => x !== this.removeLineKey) ?? [];

    return skylights.length > 0
      ? skylights[0].replace(/\[QTYSkylights\w+\]/g, skylights.length.toString())
      : '';
  }

  allSkylightDeclinedReuse(format: string) {
    return this.allSkylightReuse(format, 1);
  }

  allSkylightUsReuse(format: string) {
    return this.allSkylightReuse(format, 2);
  }

  allSkylightHomeOwnerReuse(format: string) {
    return this.allSkylightReuse(format, 3);
  }
  allSkylightReuse(format: string, typeId: number) {
    const skylights =
      this.building?.psb_measure?.psb_skylights
        ?.filter(x => x.id_fkit_option == typeId && x.need_replace == false)
        .map(x => {
          switch (x.id_skylight_size) {
            case 1:
              return (
                '- ' +
                format.replace('[width]', '22.5').replace('[lenght]', '22.5').trim()
              );
            case 2:
              return (
                '- ' +
                format.replace('[width]', '22.5').replace('[lenght]', '46.5').trim()
              );
            default:
              return this.removeLineKey;
          }
        })
        ?.filter(x => x !== this.removeLineKey) ?? [];

    return skylights.length > 0
      ? skylights[0].replace(/\[QTYSkylights\w+\]/g, skylights.length.toString())
      : '';
  }

  private async bindScopeData(description: string): Promise<string> {
    const pattern = /\[[a-zA-Z\d\(\)]+\]/g;

    for (const tag of description.match(pattern) ?? []) {
      const tagValue = (await this.getTagValue(tag))?.toString();
      if (tagValue == this.removeLineKey) {
        description = '';
      } else {
        description = description.replace(tag, tagValue);
      }
    }

    return description;
  }

  async getTagValue(tag: string) {
    switch (tag) {
      case '[QtyLayersTearOff]':
        return await this.quantityLayersTearOff();
      case '[lbllayers]':
        return await this.labelLayersTearOff();
      case '[hasInW33or63]':
        return this.hasInW33or63();
      case '[InW33or63]':
        return this.getInW33or63();
      case '[LFEavesInWS]':
        return this.lfEavesInWS();
      case '[LbSyntheticUnderlayment]':
        return await this.labelSyntheticUnderlayment();
      case '[InchesDMetal]':
        return await this.inchesDMetal();
      case '[uniqueShingle]':
        return await this.getUniqueShingleDescription();
      case '[ShingleDescription]':
        return await this.shingleDescription();
      case '[optionBelow]':
        return this.optionBelow();
      case '[optionBelowTrademark]':
        return this.optionBelowTrademark();
      case '[leak]':
        return this.needLeak();
      case '[reglet]':
        return this.quantityReglet();
      case '[hasChimneys]':
        return this.hasChimneys();
      case '[hasCrickets]':
        return this.hasCrickets();
      case '[hasNotChimneys]':
        return this.hasNotChimneys();
      case '[QTYChimneys]':
        return this.quantityChimneys();
      case '[hasSkylights]':
        return this.hasSkylights();
      case '[hasNotSkylights]':
        return this.hasNotSkylights();
      case '[QTYSkylights]':
        return this.quantitySkylights();
      case '[chimney(s)]':
        return this.labelChimneys();
      case '[hasPipeFlashing]':
        return this.hasPipeFlashing();
      case '[QtyPipeFlashing]':
        return this.quantityPipeFlashing();
      case '[QtyMetalVents]':
        return this.quantityMetalVents();
      case '[QtyMetalVents4]':
        return this.quantityMetalVents4();
      case '[QtyMetalVents6]':
        return this.quantityMetalVents6();
      case '[QtyMetalVent4]':
        return this.quantityMetalVent4();
      case '[QtyMetalVent6]':
        return this.quantityMetalVent6();
      case '[FeetSiding]':
        return this.feetSiding();
      case '[FeetSidingWithChimney]':
        return this.feetSidingWithChimney();
      case '[QTYChimneysCutSidding]':
        return this.quantityChimneysCutSidding();
      case '[WallMaterialsWithoutChimney]':
        return this.materialWallsWithoutChimneys();
      case '[WallMaterialsWithChimney]':
        return this.materialWallsWithChimneys();
      case '[wall(s)]':
        return this.quantityWalls();
      case '[QTYChimneysRidglet]':
        return this.quantityChimneysRidglet();
      case '[QTYChimneysRidgletWithoutCricket]':
        return this.quantityChimneysRidgletWithoutCrickets();
      case '[warranty]':
        return this.warranty();
      case '[QTYCricketsPitchLess3]':
        return this.quantityCricketsPitchLess3();
      case '[QTYCricketsGreater3]':
        return this.quantityCricketsPitchGreater3();
      case '[QTYCricketsChimneys]':
        return this.quantityCricketsChimneys();
      case '[width]':
        return this.removeLineKey;
      case '[lenght]':
        return this.removeLineKey;
      case '[hasPowerVents]':
        return this.hasPowerVents();
      case '[QTYPowerVents]':
        return this.quantityPowerVents();
      case '[hasSolarPowerVents]':
        return this.hasSolarPowerVents();
      case '[QTYSolarPowerVents]':
        return this.quantitySolarPowerVents();
      case '[FlatRoof]':
        return this.flatRoof();
      case '[isLowSlope]':
        return this.isLowSlope();
      case '[isSteepSlope]':
        return this.isSteepSlope();
      case '[qtyCustomSkylights]':
        return this.quantityCustomSkylights();
      case '[hipAndRidge]':
        return this.showRidgeAndOrHips();
      case '[qtyVentsUpgrade]':
        return await this.upgradeVents();
      case '[ridgeCapType]':
        return await this.ridgeCapType();
      case '[Osb]':
        return this.includeOsb();
      case '[NotOsb]':
        return this.notIncludeOsb();
      case '[CompleteOsb]':
        return this.completeOsb();
      case '[PartialOsb]':
        return this.partialOsb();
      case '[OsbQty]':
        return this.osbQty();
      case '[wmetalBuiltin]':
        return await this.wmetalBuiltin();
      case '[ridgeventBuiltin]':
        return await this.ridgeventBuiltin();
      case '[windwarrantyBuiltin]':
        return await this.windBuiltin();
      case '[materialwarrantyBuiltin]':
        return await this.materialBuiltin();
      case '[notMaterialwarrantyBuiltin]':
        return await this.notMaterialwarrantyBuiltin();
      case '[workmanwarrantyBuiltin]':
        return await this.workmanBuiltin();
      case '[notWorkmanwarrantyBuiltin]':
        return await this.notWorkmanBuiltin();
      case '[hpBuiltin]':
        return await this.hpBuiltin();
      case '[hpNotBuiltin]':
        return await this.hpNotBuiltin();
      case '[isOverlay]':
        return await this.isOverlay();
      case '[isNotOverlay]':
        return await this.isNotOverlay();
      case '[isNewConstruction]':
        return await this.isNewConstruction();
      case '[isNotNewConstruction]':
        return await this.isNotNewConstruction();
      case '[metalFlashing]':
        return await this.metalFlashing();
      case '[isTearOff]':
        return await this.isTearOff();
      case '[isNotTearOff]':
        return await this.isNotTearOff();
      case '[isRoofNails]':
        return await this.isRoofNails();
      case '[hasStoneWalls]':
        return this.hasStoneWalls();
      case '[hasNotStoneWalls]':
        return this.hasNotStoneWalls();
      case '[ridgeSize]':
        return this.getRidgeSize();
      case '[manufactureShingles]':
        return await this.getManufactureShingles();
      case '[presidentialManufactureShingles]':
        return await this.getPresidentialManufactureShingles();
      case '[architecturalManufactureShingles]':
        return await this.getArchitecturalManufactureShingles();
      case '[uniqueManufactureShingle]':
        return await this.uniqueManufactureShingle();
      case '[siddingChimneyWithCricket]':
        return this.hasSiddingChimneyWithCricket();
      case '[cutSiddingChimneyWithCricket]':
        return this.hasCutSiddingChimneyWithCricket();
      case '[notSiddingChimneyWithCricket]':
        return this.hasChimneyWithCricket();
        case '[addOrReplaceMetalVents]':
          return this.addOrReplaceMetalVents();
      default:
        return this.removeLineKey;
    }
  }

  async addOrReplaceMetalVents() {
    console.log("addOrReplaceMetalVents");
    if (this.building?.psb_measure?.vent_metal_artict_replace_pc > 0 ||
        this.building?.psb_measure?.vent_metal_artict_cut_in_pc > 0) {
          console.log("addOrReplaceMetalVents-OK");
      return "";
    }
    return this.removeLineKey;
  }

  async quantityLayersTearOff() {
    const job_types_tear_off = await this.general.getConstDecimalValue('job_types_tear_off');
    const job_types_tear_off_only = await this.general.getConstDecimalValue('job_types_tear_off_only');

    if (this.building.id_job_type == job_types_tear_off || this.building.id_job_type == job_types_tear_off_only) {
      const layers = this.building?.psb_measure?.psb_layers?.map(x => x.layer) ?? [];
      return layers.length == 0 ? this.removeLineKey : Math.max(...layers);
    } else {
      return this.removeLineKey;
    }
  }

  async labelLayersTearOff() {
    const layerCount = await this.quantityLayersTearOff();
    return layerCount == this.removeLineKey
      ? this.removeLineKey
      : layerCount == 1
        ? 'layer'
        : 'layers';
  }

  hasInW33or63() {
    const id = this.general.parseNumber(this.building?.psb_measure?.id_inwshield_rows);
    if (id == 1 || id == 2)
      return '';
    else
      return this.removeLineKey;
  }

  getInW33or63() {
    const id = this.general.parseNumber(this.building?.psb_measure?.id_inwshield_rows);
    if (id == 1)
      return '3';
    else if (id == 2)
      return '6';
    else
      return this.removeLineKey;
  }

  lfEavesInWS() {
    const id = this.building?.psb_measure?.id_inwshield_rows ?? 0;
    switch (+id) {
      case 1:
        return "3' up at eaves and 3' in Valleys";
      case 2:
        return "6' up at eaves and 3' in Valleys";
      case 3:
        return 'declined';
      case 4:
        return 'on complete roof';
    }
    return this.removeLineKey;
  }

  async labelSyntheticUnderlayment() {
    const ids =
      this.building?.psb_measure?.psb_selected_materials
        ?.filter(x => x.id_material_category == 34)
        .map(x => x.id_material_type_selected) ?? this.removeLineKey;

    if (ids == this.removeLineKey) {
      return this.removeLineKey;
    } else {
      const materials = await this.catalogService.getMeasuresMaterialTypes();
      const sizes = ids.map(
        id => materials.data.find(material => material.id == id)?.size
      );
      return sizes.length == 0
        ? this.removeLineKey
        : [...new Set(sizes)].map(x => `${x}`).join('/') + 'lb';
    }
  }

  async inchesDMetal() {
    let sizes = [];
    const materials = await this.catalogService.getMeasuresMaterialTypes();

    if (this.building?.psb_measure?.id_metal_eves_rakes_flat_roof) {
      let size = materials.data.find(
        x => x.id == this.building?.psb_measure?.id_metal_eves_rakes_flat_roof
      )?.size + '';
      if (size) {
        if(size == '2'){
          size = size + '" oversized';
        }else{
          size = size + '"';
        }
        sizes.push(size);
      }
    }
    if (this.building?.psb_measure?.id_metal_eves_starters_low_slope) {
      let size = materials.data.find(
        x => x.id == this.building?.psb_measure?.id_metal_eves_starters_low_slope
      )?.size + '';
      if (size) {
        if(size == '2'){
          size = size + '" oversized';
        }else{
          size = size + '"';
        }
        sizes.push(size);
      }
    }
    if (this.building?.psb_measure?.id_metal_lss_starters_lf) {
      let size = materials.data.find(
        x => x.id == this.building?.psb_measure?.id_metal_lss_starters_lf
      )?.size + '';
      if (size) {
        if(size == '2'){
          size = size + '" oversized';
        }else{
          size = size + '"';
        }
        sizes.push(size);
      }
    }
    if (this.building?.psb_measure?.id_metal_rakes_low_steep_slope) {
      let size = materials.data.find(
        x => x.id == this.building?.psb_measure?.id_metal_rakes_low_steep_slope
      )?.size + '';
      if (size) {
        if(size == '2'){
          size = size + '" oversized';
        }else{
          size = size + '"';
        }
        sizes.push(size);
      }
    }

    if (sizes.length == 0) {
      return this.removeLineKey;
    } else {
      const dmetal = [...new Set(sizes)].map(x => `${x}`).join(', ');
      let size = dmetal;
      return size;
    }
  }

  async getUniqueShingleDescription() {
    const description = await this.shingleDescription();
    return description.includes(',') ? this.removeLineKey : description;
  }

  async shingleDescription() {
    const activeVersion = this.project.versions.find(x => x.active);
    const trademarks = await this.catalogService.getTrademarks();
    if (activeVersion.pv_trademarks?.length > 0) {
      return activeVersion.pv_trademarks
        .filter(x => x.selected)
        .map(x => trademarks.data.find(y => y.id == x.id_trademarks).trademark)
        .join(', ');
    } else {
      return this.removeLineKey;
    }
  }

  async uniqueManufactureShingle() {
    const activeVersion = this.project.versions.find(x => x.active);
    const selected = activeVersion.shingle_lines.filter(x => x.is_selected == true);
    if (!selected || selected.length > 1 || selected.length == 0)
      return this.removeLineKey;

    const types = (await this.catalogService.getMeasuresMaterialTypes()).data;
    return types.find(x => x.id == selected[0].id_material_type).material_type;
  }

  async getManufactureShingles() {
    const activeVersion: any = this.project.versions.find(x => x.active);
    const ids = [];
    const selected: any[] = activeVersion.shingle_lines
      .slice()
      .filter(x => {
        if (ids.includes(x.id_material_type))
          return false
        else
          ids.push(x.id_material_type);
        return x.is_selected == true && !x.deletedAt;
      });
    if (!selected || selected.length == 0)
      return this.removeLineKey;

    const types = (await this.catalogService.getMeasuresMaterialTypes()).data;
    return selected.map(x => types.find(y => y.id == x.id_material_type).material_type).join(', ');
  }

  async getPresidentialManufactureShingles() {
    const category_presidential_shingle =
      await this.general.getConstDecimalValue('category_presidential_shingle');
    const category_presidential_tl_shingle =
      await this.general.getConstDecimalValue('category_presidential_tl_shingle');

    const activeVersion: any = this.project.versions.find(x => x.active);
    const ids = [];
    const selected: any[] = activeVersion.shingle_lines
      .slice()
      .filter(x => {
        if (ids.includes(x.id_material_type))
          return false
        else
          ids.push(x.id_material_type);
        return x.is_selected == true && !x.deletedAt;
      });
    if (!selected || selected.length == 0)
      return this.removeLineKey;

    const types = (await this.catalogService.getMeasuresMaterialTypes()).data;
    return selected.map(x =>
      types.find(y => y.id == x.id_material_type &&
        (y.id_material_category == category_presidential_shingle ||
          y.id_material_category == category_presidential_tl_shingle))?.material_type ?? null)
      .filter(x => x != null).join(', ');
  }

  async getArchitecturalManufactureShingles() {
    const category_architectural_regular_shingle =
      await this.general.getConstDecimalValue('category_architectural_regular_shingle');
    const category_architectural_thick_shingle =
      await this.general.getConstDecimalValue('category_architectural_thick_shingle');

    const activeVersion: any = this.project.versions.find(x => x.active);
    const ids = [];
    const selected: any[] = activeVersion.shingle_lines
      .slice()
      .filter(x => {
        if (ids.includes(x.id_material_type))
          return false
        else
          ids.push(x.id_material_type);
        return x.is_selected == true && !x.deletedAt;
      });
    if (!selected || selected.length == 0)
      return this.removeLineKey;

    const types = (await this.catalogService.getMeasuresMaterialTypes()).data;
    return selected.map(x =>
      types.find(y => y.id == x.id_material_type &&
        (y.id_material_category == category_architectural_regular_shingle ||
          y.id_material_category == category_architectural_thick_shingle))?.material_type ?? null)
      .filter(x => x != null).join(', ');
  }

  optionBelow() {
    const activeVersion = this.project.versions.find(x => x.active);
    return activeVersion.shingle_lines?.filter(x => x.is_selected)?.length > 1
      ? 'Options Below'
      : '';
  }

  optionBelowTrademark() {
    const activeVersion = this.project.versions.find(x => x.active);
    return activeVersion.pv_trademarks?.filter((x: any) => x.selected && !x.deletedAt)?.length > 1
      ? 'Options Below'
      : '';
  }

  hasNotChimneys() {
    return this.quantityChimneys() == this.removeLineKey ? '' : this.removeLineKey;
  }

  hasChimneys() {
    return this.quantityChimneys() == this.removeLineKey ? this.removeLineKey : '';
  }

  quantityChimneys() {
    const quantity =
      this.building?.psb_measure?.psb_chimneys?.filter(x => !x.deletedAt)?.length ?? 0;
    return quantity > 0 ? quantity : this.removeLineKey;
  }

  hasSkylights() {
    return this.quantitySkylights() == this.removeLineKey ? this.removeLineKey : '';
  }

  hasNotSkylights() {
    return this.quantitySkylights() == this.removeLineKey ? '' : this.removeLineKey;
  }

  quantitySkylights() {
    const quantity =
      this.building?.psb_measure?.psb_skylights?.filter(x => !x.deletedAt)?.length ?? 0;
    return quantity > 0 ? quantity : this.removeLineKey;
  }

  labelChimneys() {
    const quantity = this.quantityChimneys();
    return quantity == this.removeLineKey
      ? this.removeLineKey
      : quantity == 1
        ? 'chimney'
        : 'chimneys';
  }

  hasPipeFlashing() {
    return this.quantityPipeFlashing() == this.removeLineKey ? this.removeLineKey : '';
  }

  quantityPipeFlashing() {
    const pipeTotal =
      (this.building?.psb_measure?.flash_pipe_3_in_1_pc ?? 0) +
      (this.building?.psb_measure?.flash_pipe_2_in_1_pc ?? 0);
    return pipeTotal == 0 ? this.removeLineKey : pipeTotal;
  }

  quantityMetalVents() {
    if (!this.building?.psb_measure?.vent_is_ridgevent_in_place) {
      let quantity = this.building?.psb_measure?.vent_metal_artict_replace_pc ?? 0;
      quantity += this.building?.psb_measure?.vent_metal_artict_cut_in_pc ?? 0;
      return quantity > 0 ? quantity : this.removeLineKey;
    }
    return this.removeLineKey;
  }

  quantityMetalVents4() {
    if ((this.building?.psb_measure?.vent_j_vent_6_pc ?? 0) == 0) {
      return this.removeLineKey;
    }
    const quantity = this.building?.psb_measure?.vent_j_vent_4_pc;
    return quantity > 0 ? quantity : this.removeLineKey;
  }

  quantityMetalVents6() {
    if ((this.building?.psb_measure?.vent_j_vent_4_pc ?? 0) == 0) {
      return this.removeLineKey;
    }
    const quantity = this.building?.psb_measure?.vent_j_vent_6_pc ?? 0;
    return quantity > 0 ? quantity : this.removeLineKey;
  }

  quantityMetalVent4() {
    if ((this.building?.psb_measure?.vent_j_vent_6_pc ?? 0) > 0) {
      return this.removeLineKey;
    }
    const quantity = this.building?.psb_measure?.vent_j_vent_4_pc ?? 0;
    return quantity > 0 ? quantity : this.removeLineKey;
  }

  quantityMetalVent6() {
    if ((this.building?.psb_measure?.vent_j_vent_4_pc ?? 0) > 0) {
      return this.removeLineKey;
    }
    const quantity = this.building?.psb_measure?.vent_j_vent_6_pc ?? 0;
    return quantity > 0 ? quantity : this.removeLineKey;
  }

  materialWallsWithoutChimneys() {
    const materialIds = [2, 3, 4];
    const chimneys =
      this.building?.psb_measure?.psb_chimneys
        ?.filter(x => !x.deletedAt)
        ?.map(x => x.id_wall_material)
        ?.filter(x => materialIds.includes(x)) ?? [];

    return chimneys.length == 0 ? this.materialWalls() : this.removeLineKey;
  }

  materialWallsWithChimneys() {
    const materialIds = [2, 3, 4];
    const chimneys =
      this.building?.psb_measure?.psb_chimneys
        ?.filter(x => !x.deletedAt)
        ?.map(x => x.id_wall_material)
        ?.filter(x => materialIds.includes(x)) ?? [];

    return chimneys.length > 0 ? this.materialWalls() : this.removeLineKey;
  }

  hasStoneWalls() {
    const materials = this.materialWalls();
    return materials.includes('stone') ? '' : this.removeLineKey;
  }

  hasNotStoneWalls() {
    const materials = this.materialWalls();
    return materials.includes('stone') ? this.removeLineKey : '';
  }

  materialWalls() {
    const materialCatalog = [
      { id: 2, name: 'stucko' },
      { id: 3, name: 'stone' },
      { id: 4, name: 'brick' }
    ];
    let materials =
      this.building?.psb_measure?.psb_crickets
        ?.filter(x => !x.deletedAt)
        ?.map(x => x.id_wall_material_ew) ?? [];
    materials = [
      ...materials,
      ...(this.building?.psb_measure?.psb_crickets
        ?.filter(x => !x.deletedAt)
        ?.map(x => x.id_wall_material_sw) ?? [])
    ];
    materials = [
      ...materials,
      ...(this.building?.psb_measure?.psb_chimneys
        ?.filter(x => !x.deletedAt)
        ?.map(x => x.id_wall_material) ?? [])
    ];
    materials = [...new Set(materials)].filter(
      x => materialCatalog.findIndex(y => y.id == x) != -1
    );

    return materials.length > 0
      ? materialCatalog
        .filter(x => materials.includes(x.id))
        .map(x => x.name)
        .join('/')
      : this.removeLineKey;
  }

  quantityWalls() {
    const materialIds = [2, 3, 4];
    let total =
      this.building?.psb_measure?.psb_crickets?.filter(
        x => !x.deletedAt && materialIds.includes(x.id_wall_material_ew)
      )?.length ?? 0;
    total +=
      this.building?.psb_measure?.psb_crickets?.filter(
        x => !x.deletedAt && materialIds.includes(x.id_wall_material_sw)
      )?.length ?? 0;
    total +=
      this.building?.psb_measure?.psb_chimneys?.filter(
        x => !x.deletedAt && materialIds.includes(x.id_wall_material)
      )?.length ?? 0;
    return total > 0
      ? total == 1
        ? `${total} wall`
        : `${total} walls`
      : this.removeLineKey;
  }

  feetSiding() {
    if (
      this.building?.psb_measure?.psb_chimneys?.some(
        x => x.need_cutsidding == true && !x.deletedAt
      ) ??
      false
    ) {
      return this.removeLineKey;
    }

    let total = 0;
    total +=
      this.building?.psb_measure?.psb_crickets
        ?.filter(x => x.is_cut_sw && !x.deletedAt)
        ?.reduce((previous, current) => previous + current.sidewall_lf, 0) ?? 0;
    total +=
      this.building?.psb_measure?.psb_crickets
        ?.filter(x => x.is_cut_ew && !x.deletedAt)
        ?.reduce((previous, current) => previous + current.endwall_lf, 0) ?? 0;
    return total > 0 ? total : this.removeLineKey;
  }

  feetSidingWithChimney() {
    if (
      !(
        this.building?.psb_measure?.psb_chimneys?.some(
          x => x.need_cutsidding == true && !x.deletedAt
        ) ?? false
      )
    ) {
      return this.removeLineKey;
    }
    let total = 0;
    total +=
      this.building?.psb_measure?.psb_crickets
        ?.filter(x => x.is_cut_sw && !x.deletedAt)
        ?.reduce((previous, current) => previous + current.sidewall_lf, 0) ?? 0;
    total +=
      this.building?.psb_measure?.psb_crickets
        ?.filter(x => x.is_cut_ew && !x.deletedAt)
        ?.reduce((previous, current) => previous + current.endwall_lf, 0) ?? 0;
    total +=
      this.building?.psb_measure?.psb_chimneys
        ?.filter(x => x.need_cutsidding && !x.deletedAt)
        ?.reduce(
          (previous, current) => previous + current.width * 2 + current.lenght * 2,
          0
        ) ?? 0;
    return total > 0 ? total : this.removeLineKey;
  }

  quantityChimneysCutSidding() {
    const chimneyCount =
      this.building?.psb_measure?.psb_chimneys?.filter(
        x => x.need_cutsidding && !x.deletedAt
      )?.length ?? 0;
    return chimneyCount == 0
      ? 0
      : chimneyCount == 1
        ? `${chimneyCount} chimney`
        : `${chimneyCount} chimneys`;
  }

  needLeak() {
    return this.building?.psb_measure?.psb_crickets?.some(
      x => (x.is_leak_ew || x.is_leak_sw) && !x.deletedAt
    ) ||
      this.building?.psb_measure?.psb_chimneys?.some(
        x => x.need_leakexclusion && !x.deletedAt
      )
      ? ''
      : this.removeLineKey;
  }

  quantityReglet() {
    let total =
      this.building?.psb_measure?.psb_crickets?.filter(
        x => (x.is_leak_ew || x.is_leak_sw) && !x.deletedAt
      )?.length ?? 0;
    total +=
      this.building?.psb_measure?.psb_chimneys?.filter(
        x => x.need_leakexclusion && !x.deletedAt
      )?.length ?? 0;

    return total == 0
      ? this.removeLineKey
      : total == 1
        ? `${total} detail is`
        : `${total} details are`;
  }

  quantityChimneysRidglet() {
    const chimneyCount =
      this.building?.psb_measure?.psb_chimneys?.filter(
        x => x.need_ridglet && !x.deletedAt
      )?.length ?? 0;
    return chimneyCount == 0
      ? this.removeLineKey
      : chimneyCount == 1
        ? `${chimneyCount} chimney`
        : `${chimneyCount} chimneys`;
  }

  quantityChimneysRidgletWithoutCrickets() {
    if (
      (this.building?.psb_measure?.psb_crickets?.filter(x => !x.deletedAt)?.length ?? 0) >
      0
    ) {
      return this.removeLineKey;
    }
    return this.quantityChimneysRidglet();
  }

  warranty() {
    const standardAndMaterialIds = [1, 2, 3, 6, 7];
    const hasStoneWithWarranty =
      (this.building?.psb_measure?.psb_crickets?.some(
        x => (x.id_wall_material_ew == 3 || x.id_wall_material_sw == 3) && !x.deletedAt
      ) ||
        this.building?.psb_measure?.psb_chimneys?.some(
          x => x.id_wall_material == 3 && !x.deletedAt
        )) &&
      standardAndMaterialIds.includes(
        this.building?.psb_measure?.id_project_warranty_option ?? 0
      );

    return hasStoneWithWarranty ? '' : this.removeLineKey;
  }

  quantityCricketsPitchLess3() {
    const count =
      this.building?.psb_measure?.psb_crickets?.filter(x => x.pitch < 3 && !x.deletedAt)
        ?.length ?? 0;
    return count == 0
      ? this.removeLineKey
      : count == 1
        ? `${count} cricket`
        : `${count} crickets`;
  }

  quantityCricketsPitchGreater3() {
    const count =
      this.building?.psb_measure?.psb_crickets?.filter(x => x.pitch >= 3 && !x.deletedAt)
        ?.length ?? 0;
    return count == 0
      ? this.removeLineKey
      : count == 1
        ? `${count} cricket`
        : `${count} crickets`;
  }

  hasCrickets() {
    const hasCrickets =
      (this.building?.psb_measure?.psb_crickets?.filter(x => !x.deletedAt)?.length ?? 0) >
      0;
    return hasCrickets ? '' : this.removeLineKey;
  }

  quantityCricketsChimneys() {
    const chimney =
      this.building?.psb_measure?.psb_chimneys?.filter(x => x.width >= 30 && !x.deletedAt)
        ?.length ?? 0;
    const hasCrickets =
      (this.building?.psb_measure?.psb_crickets?.filter(x => !x.deletedAt)?.length ?? 0) >
      0;

    return !hasCrickets && chimney > 0
      ? chimney == 1
        ? `${chimney} chimney`
        : `${chimney} chimneys`
      : this.removeLineKey;
  }

  hasPowerVents() {
    const qty = this.quantityPowerVents();
    return qty == this.removeLineKey ? this.removeLineKey : '';
  }

  quantityPowerVents() {
    const vents = this.building?.psb_measure?.vent_power_vent_pc ?? 0;
    return vents > 0 ? vents : this.removeLineKey;
  }

  hasSolarPowerVents() {
    const qty = this.quantitySolarPowerVents();
    return qty == this.removeLineKey ? this.removeLineKey : '';
  }

  quantitySolarPowerVents() {
    const vents = this.building?.psb_measure?.vent_solar_power_vent_pc ?? 0;
    return vents > 0 ? vents : this.removeLineKey;
  }

  flatRoof() {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch < 2 && !x.deletedAt)
      ? ''
      : this.removeLineKey;
  }

  isLowSlope() {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 2 && x.pitch < 4 && !x.deletedAt)
      ? ''
      : this.removeLineKey;
  }

  isSteepSlope() {
    return this.building?.psb_measure?.psb_slopes?.some(x => x.pitch >= 4 && !x.deletedAt)
      ? ''
      : this.removeLineKey;
  }

  quantityCustomSkylights() {
    const quantity = this.building?.psb_measure?.psb_skylights
      ?.filter(x => x.id_skylight_size == 3)
      ?.length ?? 0;

    return quantity == 0 ? this.removeLineKey : quantity;
  }

  showRidgeAndOrHips() {
    const hasRidge = (this.building?.psb_measure?.ridge_lf ?? 0) > 0;
    const hasHips = (this.building?.psb_measure?.hips_lf ?? 0) > 0;
    if (hasRidge && hasHips) {
      return "ridge and hip";
    } else if (hasRidge) {
      return "ridge";
    } else if (hasHips) {
      return "hip";
    } else {
      return this.removeLineKey;
    }
  }

  async upgradeVents() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_ridgevents = await this.general.getConstDecimalValue('upgrade_ridgevents');
    const isBuiltUpgrade = this.project?.versions?.find(x => x.active)?.buildings?.find(x => x.is_main_building)?.psb_measure?.psb_upgrades?.some(x => x.id_cost_integration == cost_integration_built_in && x.id_upgrade == upgrade_ridgevents);

    if (isBuiltUpgrade && !this.building?.psb_measure?.vent_is_ridgevent_in_place) {
      let vents = this.general.parseNumber(this.building.psb_measure.vent_power_vent_pc);
      vents += this.general.parseNumber(this.building.psb_measure.vent_solar_power_vent_pc);
      vents += this.general.parseNumber(this.building.psb_measure.vent_metal_artict_cut_in_pc);

      if (vents > 0) {
        return vents;
      }
    }
    return this.removeLineKey;
  }

  async ridgeCapType() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_ridgecap = await this.general.getConstDecimalValue('upgrade_ridgecap');
    const isBuiltUpgrade = this.project?.versions?.find(x => x.active)?.buildings?.find(x => x.is_main_building)?.psb_measure?.psb_upgrades?.some(x => x.id_cost_integration == cost_integration_built_in && x.id_upgrade == upgrade_ridgecap);

    if (isBuiltUpgrade) {
      return 'high profile'
    } else {
      return 'flat';
    }
  }

  includeOsb() {
    const quantity = this.osbQty();
    return quantity == this.removeLineKey ? this.removeLineKey : '';
  }

  notIncludeOsb() {
    const quantity = this.osbQty();
    return quantity != this.removeLineKey ? this.removeLineKey : '';
  }

  osbQty() {
    const wasting = 1 + (this.building.psb_measure.wasting * 0.01);

    const quantity = (this.building.psb_measure.psb_slopes
      .reduce((previous, current) => previous + this.general.parseNumber(current.osb_area), 0) ?? 0)
      * wasting;

    return quantity == 0 ? this.removeLineKey : quantity.toFixed(2);
  }

  completeOsb() {
    const allOsb = this.building.psb_measure.psb_slopes
      .every(x => this.general.parseNumber(x.osb_area) == this.general.parseNumber(x.shingle_area));

    return allOsb == true ? '' : this.removeLineKey;
  }

  partialOsb() {
    const partialOsb = this.building.psb_measure.psb_slopes
      .some(x => this.general.parseNumber(x.osb_area) > 0
        && this.general.parseNumber(x.osb_area) != this.general.parseNumber(x.shingle_area));

    return partialOsb == true ? '' : this.removeLineKey;
  }

  async wmetalBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_w_metal = await this.general.getConstDecimalValue('upgrade_w_metal');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_w_metal);

    return upgrade ? '' : this.removeLineKey;
  }

  async ridgeventBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_ridgevents = await this.general.getConstDecimalValue('upgrade_ridgevents');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_ridgevents);

    return upgrade ? '' : this.removeLineKey;
  }

  async windBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_wind_warranty = await this.general.getConstDecimalValue('upgrade_wind_warranty');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_wind_warranty);

    return upgrade ? '' : this.removeLineKey;
  }

  async notMaterialwarrantyBuiltin() {
    return (await this.materialBuiltin() == this.removeLineKey) ? '' : this.removeLineKey;
  }

  async materialBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_material_warranty = await this.general.getConstDecimalValue('upgrade_material_warranty');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_material_warranty);

    return upgrade ? '' : this.removeLineKey;
  }

  async notWorkmanBuiltin() {
    return await this.workmanBuiltin() == this.removeLineKey ? '' : this.removeLineKey;
  }

  async workmanBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_workmanship_warranty = await this.general.getConstDecimalValue('upgrade_workmanship_warranty');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_workmanship_warranty);

    return upgrade ? '' : this.removeLineKey;
  }

  async hpBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_ridgecap = await this.general.getConstDecimalValue('upgrade_ridgecap');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_ridgecap);

    return upgrade ? '' : this.removeLineKey;
  }

  async hpNotBuiltin() {
    const cost_integration_built_in = await this.general.getConstDecimalValue('cost_integration_built_in');
    const upgrade_ridgecap = await this.general.getConstDecimalValue('upgrade_ridgecap');

    const upgrade = this.project.versions.find(x => x.active).buildings.find(x => x.is_main_building).psb_measure.psb_upgrades
      .find(x => x.id_cost_integration == cost_integration_built_in
        && x.id_upgrade == upgrade_ridgecap);

    return upgrade ? this.removeLineKey : '';
  }

  async isOverlay() {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
    return this.building.id_job_type == job_types_overlay ? '' : this.removeLineKey;
  }

  async isNotOverlay() {
    const job_types_overlay = await this.general.getConstDecimalValue('job_types_overlay');
    return this.building.id_job_type == job_types_overlay ? this.removeLineKey : '';
  }

  async isNewConstruction() {
    const job_types_new_construction = await this.general.getConstDecimalValue('job_types_new_construction');
    return this.building.id_job_type == job_types_new_construction ? '' : this.removeLineKey;
  }

  async isNotNewConstruction() {
    const job_types_new_construction = await this.general.getConstDecimalValue('job_types_new_construction');
    return this.building.id_job_type == job_types_new_construction ? this.removeLineKey : '';
  }

  async metalFlashing() {
    let rolledMetalLF = this.general.parseNumber(this.building.psb_measure.flash_rolled_metal_20_50_lf);
    rolledMetalLF += await this.getCricketsRollMetalLF(this.building.psb_measure);
    rolledMetalLF += await this.getChimneyRollMetalLF(this.building.psb_measure);

    return rolledMetalLF > 0 ? ' and metal flashing' : '';
  }

  private async getCricketsRollMetalLF(psbMeasure: PsbMeasures) {
    const rollMetalCrickets = await this.general.getConstDecimalValue('rolled_metal_crickets');
    return (psbMeasure?.psb_crickets?.filter(x => !x.deletedAt)?.length ?? 0) * (+rollMetalCrickets);
  }

  private async getChimneyRollMetalLF(psbMeasure: PsbMeasures) {
    const rollMetalChimneys = await this.general.getConstDecimalValue('rolled_metal_chimneys');
    return (psbMeasure?.psb_chimneys?.filter(x => (x.cricket_exists == true || x.width < 30) && !x.deletedAt)?.length ?? 0) * (+rollMetalChimneys);
  }

  async isTearOff() {
    const job_types_tear_off = await this.general.getConstDecimalValue('job_types_tear_off');
    const job_types_tear_off_only = await this.general.getConstDecimalValue('job_types_tear_off_only');
    return this.building.id_job_type == job_types_tear_off || this.building.id_job_type == job_types_tear_off_only
      ? ''
      : this.removeLineKey;
  }

  async isNotTearOff() {
    const job_types_tear_off = await this.general.getConstDecimalValue('job_types_tear_off');
    const job_types_tear_off_only = await this.general.getConstDecimalValue('job_types_tear_off_only');
    return this.building.id_job_type == job_types_tear_off || this.building.id_job_type == job_types_tear_off_only
      ? this.removeLineKey
      : '';
  }

  async isRoofNails() {
    const wind = await this.windBuiltin();
    return wind == this.removeLineKey ? '5' : '6';
  }

  async getRidgeSize() {
    const ridgeCategory = await this.general.getConstDecimalValue('category_ridgecap');
    const ids =
      this.building?.psb_measure?.psb_selected_materials
        ?.filter(x => x.id_material_category == ridgeCategory)
        .map(x => x.id_material_type_selected) ?? this.removeLineKey;

    if (ids == this.removeLineKey) {
      return this.removeLineKey;
    } else {
      const materials = await this.catalogService.getMeasuresMaterialTypes();
      const sizes = ids.map(
        id => materials.data.find(material => material.id == id)?.size
      );

      const ridgecap_10 = await this.general.getConstDecimalValue('ridgecap_10_ridgevent_size_compatibility');
      const ridgecap_12 = await this.general.getConstDecimalValue('ridgecap_12_ridgevent_size_compatibility');

      return sizes.length == 0
        ? this.removeLineKey
        : (sizes[0] == 10) ? ridgecap_10 : ridgecap_12;
    }
  }

  hasSiddingChimneyWithCricket() {
    const siddingMaterialId = 1;
    const exists = this.building.psb_measure.psb_chimneys.some(x =>
      x.id_wall_material == siddingMaterialId
      && !x.cricket_exists
      && x.cricket_height
      && x.cricket_height > 0
      && !x.need_cutsidding);

    return exists ? '' : this.removeLineKey;
  }

  hasCutSiddingChimneyWithCricket() {
    const siddingMaterialId = 1;
    const exists = this.building.psb_measure.psb_chimneys.some(x =>
      x.id_wall_material == siddingMaterialId
      && !x.cricket_exists
      && x.cricket_height
      && x.cricket_height > 0
      && x.need_cutsidding);

    return exists ? '' : this.removeLineKey;
  }

  hasChimneyWithCricket() {
    const stuckoMaterialId = 2;
    const stoneMaterialId = 3;
    const brickMaterialId = 4;
    const exists = this.building.psb_measure.psb_chimneys.some(x =>
      (x.id_wall_material == stuckoMaterialId
        || x.id_wall_material == stoneMaterialId
        || x.id_wall_material == brickMaterialId)
      && !x.cricket_exists
      && x.cricket_height
      && x.cricket_height > 0);

    return exists ? '' : this.removeLineKey;
  }

  /**
   * Save scope info
   */
  save() {
    const scope: PbScope = {
      ...this.scope,
      scope_of_work: this.text,
      is_modified: true,
      isModified: true,
      title: this.building.job_type.job_type
    };
    const exist = this.building.pb_scopes.find(x => x.id == scope.id);
    let scopes: PbScope[] = [];

    if (exist) {
      scopes = this.building.pb_scopes.map(element => {
        if (element.id == scope.id) {
          return { ...scope };
        } else {
          return { ...element };
        }
      });
    } else {
      scopes.push(scope);
    }

    const building: Building = { ...this.building, pb_scopes: scopes };
    this.projectService.saveProjectBuilding(building);
    this.modalController.dismiss();
  }

  cancel() {
    this.modalController.dismiss();
  }

  async generate() {
    const modal = await this.modalController.create({
      component: DeleteComponent,
      cssClass: 'delete',
      componentProps: {
        message: 'Are you sure to generate the scope of work?'
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.delete) {
      await this.getDescriptions();
    }
  }
}
