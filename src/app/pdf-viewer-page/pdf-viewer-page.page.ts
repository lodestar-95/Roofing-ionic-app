import { Trademark } from './../models/trademark.model';
import { Building } from './../models/building.model';
import { Component, OnInit } from '@angular/core';
import { NavController, Platform, PopoverController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../app.reducer';
import { PDFDocumentProxy } from 'ng2-pdf-viewer';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { PopoverOptionsListComponent } from '../prospecting/components/popover-options-list/popover-options-list.component';
import { CatalogsService } from 'src/app/services/catalogs.service';
import { formatCurrency } from '@angular/common';
import { CalculationService } from '../estimate/calculation/calculation.service';
import { LoadingController } from '@ionic/angular';
import { ProjectsService } from '../services/projects.service';
import { Project } from '../models/project.model';
import { GeneralService } from '../estimate/calculation/materials/general.service';
import { SyncProjectsService } from '../services/sync-projects.service';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
(window as any).pdfWorkerSrc = '../../assets/js/pdf.worker.min.js';

@Component({
  selector: 'app-pdf-viewer-page',
  templateUrl: './pdf-viewer-page.page.html',
  styleUrls: ['./pdf-viewer-page.page.scss']
})
export class PdfViewerPagePage implements OnInit {
  project: Project;
  pdfSrc: any;
  pdfs = [];
  pdfObject: any;
  totalPages: any;
  page = 1;
  proposalValid: number = 30;
  urlpath: any;
  buildingOp = [];
  typeOp = [
    { id: 1, option: 'Luxury', selected: false, active: false },
    { id: 2, option: 'Architectural', selected: false, active: false }
  ];
  buildinTxt: String = 'Storage';
  typeTxt: string = 'Architectural';
  ///
  shingleLines: any;
  buildings: any;
  trademarks: any;
  MaterialTypes: any;
  logosM: any = [];
  calculations: any;
  costType = 1;
  loading: any;
  //data pdf
  stName: String;
  stAddress: string;
  stPhone: string;
  stEmail: string;
  datePdf: string;
  catalogGeneral: any;
  colors: any = [];
  canSendEmail = true;
  canChangeStatus = false;

  constructor(
    private navController: NavController,
    private activatedRoute: ActivatedRoute,
    private file: File,
    private platform: Platform,
    private emailComposer: EmailComposer,
    private popoverController: PopoverController,
    private store: Store<AppState>,
    private catalogsService: CatalogsService,
    private calculation: CalculationService,
    private loadingCtrl: LoadingController,
    private projectService: ProjectsService,
    private general: GeneralService,
    private synProjects: SyncProjectsService
  ) {
    this.project = this.activatedRoute.snapshot.queryParams.project;
    console.log(this.activatedRoute);

    this.loadingCtrl
      .create({
        spinner: 'circles'
      })
      .then(res => {
        this.loading = res;
        if (this.platform.is('cordova')) {
          this.loading.present();
        }
      });
  }

  ngOnInit() {
    this.iniLogos().then(resp => {
      this.getListBuildings();
    });
  }

  close() {
    this.navController.back();
  }

  async iniLogos() {
    this.logosM.push(
      await this.getBase64ImageFromURL('../../assets/imgs/EH-RCE-31928.png'),
      await this.getBase64ImageFromURL('../../assets/imgs/Certain_Teed_logo.png'),
      await this.getBase64ImageFromURL('../../assets/imgs/Owens_Corning_logo.jpeg'),
      await this.getBase64ImageFromURL('../../assets/imgs/Malarkey_logo.png'),
      await this.getBase64ImageFromURL('../../assets/imgs/Accredited_buisness.png')
    );
    return this.logosM;
  }

  async getListBuildings() {
    try {
      if (this.project) {
        this.canSendEmail = await this.areAllScopeVerified();
        this.calculations = (
          await this.calculation.calculateBidsheet(this.project)
        ).data.buildings;

        this.stName = this.project.st_name;
        this.stAddress = this.project.st_address;
        this.stPhone = this.project.st_phone ? `P: ${this.project.st_phone}` : '';
        this.stEmail = this.project.st_email ? `E: ${this.project.st_email}` : '';
        this.datePdf = this.formatDate(new Date());

        //extraer la versión activa
        const version = this.project.versions.find(version => version.active == true);
        if (version) {
          this.costType = version.id_cost_type != undefined ? version.id_cost_type : 1;
          this.buildings = version.buildings;
          this.shingleLines =
            version.shingle_lines != undefined
              ? version.shingle_lines.filter(f => f.is_selected)
              : [];
          let cont = 1;
          version.buildings.forEach(building => {
            if (cont == 1) {
              this.buildinTxt = building.description;
            }
            this.buildingOp.push({
              id: building.id,
              option: building.description,
              selected: cont == 1 ? true : false
            });
            cont++;
          });

          let groupColors = await this.catalogsService.getGroupColors().then(resp => {
            return resp.data;
          });
          let groups = await this.catalogsService.getGroups().then(resp => {
            return resp.data;
          });

          if (version.pv_colors != undefined) {
            version.pv_colors.forEach(color => {
              this.colors.push({
                group: groups.find(g => g.id == color.id_group).group,
                color: groupColors.find(gc => gc.id == color.id_group_color).color
              });
            });
          }
        }
        this.dataSelect();
      }
      //////////////
    } catch (error) {
      console.error(error);
    }
  }

  async areAllScopeVerified(): Promise<boolean> {
    const category_architectural_regular_shingle =
      await this.general.getConstDecimalValue('category_architectural_regular_shingle');
    const category_architectural_thick_shingle = await this.general.getConstDecimalValue(
      'category_architectural_thick_shingle'
    );

    const category_presidential_shingle = await this.general.getConstDecimalValue(
      'category_presidential_shingle'
    );
    const category_presidential_tl_shingle = await this.general.getConstDecimalValue(
      'category_presidential_tl_shingle'
    );
    const materialTypes = (await this.catalogsService.getMeasuresMaterialTypes()).data;

    const version = this.project.versions.find(x => x.active);

    const hasArchitectural = version.shingle_lines.some(line => {
      if (line.is_selected == false) {
        return false;
      }

      const materialType = materialTypes.find(type => type.id == line.id_material_type);
      return (
        materialType.id_material_category == category_architectural_regular_shingle ||
        materialType.id_material_category == category_architectural_thick_shingle
      );
    });

    const hasPresidential = version.shingle_lines.some(line => {
      if (line.is_selected == false) {
        return false;
      }

      const materialType = materialTypes.find(type => type.id == line.id_material_type);
      return (
        materialType.id_material_category == category_presidential_shingle ||
        materialType.id_material_category == category_presidential_tl_shingle
      );
    });

    for (const building of version.buildings) {
      for (const scope of building.pb_scopes) {
        if (hasArchitectural && scope.is_architectural && scope.is_verified == false) {
          return false;
        }

        if (
          hasPresidential &&
          scope.is_architectural == false &&
          scope.is_verified == false
        ) {
          return false;
        }
      }
    }
    return true;
  }

  async dataSelect() {
    const currentVersion = this.project.versions.find(x => x.active);
    //catalogos de materiales
    this.MaterialTypes = await this.catalogsService
      .getMeasuresMaterialTypes()
      .then(resp => {
        return resp.data;
      });

    //catalogos de marcas
    this.trademarks = await (
      await this.catalogsService.getTrademarks().then(resp => {
        return resp.data;
      })
    ).filter(f => f.is_shingle_trademark);

    //obtener materiales de shingle
    let materials = [];
    this.shingleLines.forEach(shingle => {
      let material = this.MaterialTypes.find(e => e.id == shingle.id_material_type);
      materials.push(material);
    });

    let buildingsType = [];


    let _shingleLineName = materials.length == 1 ? materials[0].material_type : '';

    this.buildings.forEach(bOpt => {
      //if (bOpt.id == '108') {
      let calculationsBuilding = this.calculations.find(
        cal => cal.id_building === bOpt.id
      );
      let buildingTotals = calculationsBuilding.totals.filter(
        f => f.id_psb_measure == bOpt.psb_measure.id && f.id_cost_type == this.costType
      );

      let building = {
        building: bOpt,
        shingleLineName: _shingleLineName,
        types: [
          { Presidential: { active: false, mark: [], calculations: [] } },
          { Architectural: { active: false, mark: [], calculations: [] } }
        ]
      };
      this.typeOp.forEach(TOp => {
        if (TOp.id == 1) {
          let found = {};
          let materialArray = materials.filter(
            f => f.id_material_category == 3 || f.id_material_category == 37
          );
          let PresidentialType = materials
            .filter(f => f.id_material_category == 3 || f.id_material_category == 37)
            .filter(function (element) {
              return found.hasOwnProperty(element.id_trademark)
                ? false
                : (found[element.id_trademark] = true);
            });

          materialArray.forEach(ma => {
            let total = buildingTotals.find(bt => bt.id_material_type_shingle == ma.id);
            if (total != undefined) {
              building.types[0].Presidential.calculations.push({
                idTrademark: ma.id_trademark,
                name: ma.material_type,
                value: total.total
              });
            }
          });

          PresidentialType.forEach(e => {
            let mark = this.trademarks.find(eF => eF.id == e.id_trademark);
            building.types[0].Presidential.mark.push(mark);
          });

          let hasCalculations =
            building.types[0].Presidential.calculations.length > 0 ? true : false;
          let hasMark = building.types[0].Presidential.mark.length > 0 ? true : false;
          building.types[0].Presidential.active =
            hasMark || hasCalculations ? true : false;
          TOp.active = hasMark || hasCalculations ? true : false;
          TOp.selected = hasMark || hasCalculations ? true : false;
        } else {
          let found = {};
          let materialArray = materials.filter(
            f => f.id_material_category == 2 || f.id_material_category == 36
          );
          let ArchitecturalType = materials
            .filter(f => f.id_material_category == 2 || f.id_material_category == 36)
            .filter(function (element) {
              return found.hasOwnProperty(element.id_trademark)
                ? false
                : (found[element.id_trademark] = true);
            });
          materialArray.forEach(ma => {
            let total = buildingTotals.find(bt => bt.id_material_type_shingle == ma.id);
            if (total != undefined) {
              building.types[1].Architectural.calculations.push({
                idTrademark: ma.id_trademark,
                name: ma.material_type,
                value: total.total
              });
            }
          });
          ArchitecturalType.forEach(e => {
            let mark = this.trademarks.find(eF => eF.id == e.id_trademark);
            building.types[1].Architectural.mark.push(mark);
          });
          let hasCalculations =
            building.types[1].Architectural.calculations.length > 0 ? true : false;
          let hasMark = building.types[1].Architectural.mark.length > 0 ? true : false;
          building.types[1].Architectural.active =
            hasMark || hasCalculations ? true : false;

          TOp.active = hasMark || hasCalculations ? true : false;
          TOp.selected = hasMark || hasCalculations ? true : false;
        }
      });

      const isArquitecturalSelected = this.typeOp.some(
        x => x.option === 'Architectural' && x.active === true && x.selected === true
      );
      const isPresidentialSelected = this.typeOp.some(
        x => x.option === 'Luxury' && x.active === true && x.selected === true
      );
      if (isArquitecturalSelected && isPresidentialSelected) {
        this.typeOp.find(x => x.option === 'Luxury').selected = false;
      }

      buildingsType.push(building);
      //}
    });

    const dbUpgrades = (await this.catalogsService.getUpgrades()).data;
    for (const building of buildingsType) {
      let optionsArray = [];
      if (building.building.psb_measure.hasOwnProperty('psb_options')) {
        building.building.psb_measure.psb_options.forEach((element, index) => {

          if (!element.is_built_in) {
            optionsArray.push({
              name: `Option ${index + 1}`,
              description: element.option,
              total: formatCurrency(element.cost * element.qty_hours, 'en-US', '$')
            });
          }
        });
      }

      for (const [key, type] of building.types.entries()) {
        this.typeTxt =
          type.Architectural && type.Architectural.active
            ? 'Architectural'
            : 'Luxury';
        let isActive = false;
        if (key == 0) {
          isActive = type.Presidential.active;
        } else {
          isActive = type.Architectural.active;
        }
        if (isActive) {
          let scope;
          if (key == 0) {
            scope = building.building.pb_scopes.find(sc => !sc.is_architectural);
          } else {
            scope = building.building.pb_scopes.find(sc => sc.is_architectural);
          }
          let logos = key == 0 ? type.Presidential : type.Architectural;

          let mainBuilding = this.buildings.find(e => e.is_main_building);
          let currentBuilding = this.buildings.find(e => e.id == building.building.id);
          let upgrades =
            mainBuilding.psb_measure.psb_upgrades != undefined
              ? mainBuilding.psb_measure.psb_upgrades.filter(f => f.id_cost_integration == 2)
              : [];
          let upgradesConceptType = [];
          let buildingUpgrades = this.calculations.find(
            cal => cal.id_building == currentBuilding.id
          ).upgrades;
          const conceptType = [...dbUpgrades];
          upgrades.forEach(upgrade => {
            let costBuildingUpgrades = buildingUpgrades.filter(
              bu => bu.id_upgrade == upgrade.id_upgrade
            );
            costBuildingUpgrades?.forEach(costUpgrade => {
              if (currentVersion.shingle_lines.some(x =>
                x.id_material_type == costUpgrade.id_material_type_shingle
                && x.is_selected == true)) {
                const shingleline = materials.find(x => x.id == costUpgrade.id_material_type_shingle);
                const shingleName = logos.mark.find(x => x.id == shingleline.id_trademark)?.trademark;
                const upgradeName = conceptType.find(e => e.id == upgrade.id_upgrade).upgrade;

                if (shingleName && !upgradesConceptType.some(x => x.shingle == shingleName && x.name == upgradeName)) {
                  upgradesConceptType.push({
                    name: upgradeName,
                    value: costUpgrade != undefined ? costUpgrade.total : 0,
                    shingle: shingleName
                  });
                }
              }
            });
          });

          const footerText = await this.general.getConstValue('pdf_footer_text');

          this.generatePdf(
            building,
            logos,
            scope,
            key == 0 ? 'Luxury' : 'Architectural',
            optionsArray,
            upgradesConceptType,
            footerText
          );
        }

      }
    }
    this.getPdfs();
  }

  async getJobType(trademarks, building){
    trademarks = trademarks.reduce((acc,item)=>{
      if(!acc.includes(item)){
        acc.push(item);
      }
      return acc;
    },[]);
    console.log(trademarks);

    let materialCategories = [];
    this.shingleLines.forEach(shingle => {
      let material = this.MaterialTypes.find(e => e.id == shingle.id_material_type);
      materialCategories.push(material.id_material_category);
    });
    console.log('materialCategories');
    console.log(materialCategories);
    const category_shingle_architectural = await this.general.getConstValue('category_shingle_architectural');
    const category_shingle_presidential = await this.general.getConstValue('category_shingle_presidential');
    console.log(category_shingle_architectural);
    console.log(category_shingle_presidential);
    console.log(materialCategories.filter( x => category_shingle_presidential.includes(x)));

    let materialCategory = '';
    if (materialCategories.filter( x => category_shingle_architectural.includes(x)).length > 0){
      materialCategory = 'Architectural Asphalt Shingle';
    }
    if (materialCategories.filter( x => category_shingle_presidential.includes(x)).length > 0){
      console.log('entre');
      if(materialCategory != ''){
        materialCategory += ' and ';
      }
      materialCategory += 'Luxury Asphalt Shingle';
    }

    let jobType = `${building.building.job_type.job_type} on ${building.building.description} with ${building.shingleLineName}`;
    const job_types_new_construction = await this.general.getConstDecimalValue('job_types_new_construction');
    let shingleType;
    console.log(building);
    console.log(building.building);
    console.log(this.shingleLines[0]);
    if(building.building.job_type.id == job_types_new_construction){
      if(this.trademarks.length > 1){
        shingleType = '';
      }else{
        shingleType = trademarks[0];
      }
      jobType = `Dry sheet and shingle installation on ${building.building.description} with ${building.shingleLineName} ${materialCategory}`;
    }
    return jobType;
  }

  async generatePdf(building, logos, scope, type, optionsList, upgrades, footerText) {
    const logo4 = this.logosM[4];
    let tableLogos = [
      {
        image: this.logosM[0],
        width: 80,
        height: 60,
        marginTop: 0
      },
      '',
      '',
      ''
    ];
    let shingleTrademarks = [];
    this.trademarks.forEach(async trademark => {
      shingleTrademarks.push(trademark.trademark);
      switch (trademark.id) {
        case 1: //CertainTed:
          let CertainTed = logos.mark.find(logo => logo.id == 1);
          if (CertainTed != undefined) {
            tableLogos[1] = {
              image: this.logosM[1],
              width: 60,
              height: 60,
              marginTop: 0
            };
          } else {
            tableLogos[1] = '';
          }
          break;
        case 2: //Owens Corning:
          let Owens = logos.mark.find(logo => logo.id == 2);
          if (Owens != undefined) {
            tableLogos[2] = {
              image: this.logosM[2],
              width: 145,
              height: 45,
              marginTop: 10
            };
          } else {
            tableLogos[2] = '';
          }
          break;
        case 3: //Malarkeys:
          let Malarkeys = logos.mark.find(logo => logo.id == 3);
          if (Malarkeys != undefined) {
            tableLogos[3] = {
              image: this.logosM[3],
              width: 60,
              height: 60,
              marginTop: 0
            };
          } else {
            tableLogos[3] = '';
          }
          break;
        default:
          break;
      }
    });

    let colorPdf = [];
    this.colors.forEach((color, key) => {
      let alignment;
      switch (key) {
        case 0:
          alignment = 'left';
          break;
        case 1:
          alignment = 'center';
          break;
        case 2:
          alignment = 'right';
          break;
        default:
          break;
      }
      colorPdf.push({
        text: [{ text: `${color.group} color: `, bold: true }, { text: color.color }],
        alignment: alignment
      });
    });
    //Total
    var amountTotals = [];
    if (logos.calculations.length == 0) {
      amountTotals.push([
        [{ text: 'Total proposal amount: ', bold: true, alignment: 'right' }],
        [{ text: '' }],
        [{ text: '' }]
      ]);
    }
    logos.calculations.forEach((amount, index) => {
      var row = [];
      if (index == 0) {
        row.push({ text: 'Total proposal amount: ', bold: true, alignment: 'right' });
      } else {
        row.push('');
      }
      row.push(
        [{ text: `Amount with ${amount.name}: `, bold: true, alignment: 'right' }],
        [{ text: formatCurrency(amount.value, 'en-US', '$') }]
      );
      amountTotals.push(row);
    });
    //Upgrade
    var upgradeTotals = [];
    if (upgrades.length == 0) {
      upgradeTotals.push([
        [{ text: 'Upgrade: ', bold: true, alignment: 'right' }],
        [{ text: '' }],
        [{ text: '' }]
      ]);
    }
    upgrades.forEach((upgrade, key) => {
      var row = [];
      if (key == 0) {
        row.push({ text: 'Upgrade: ', bold: true, alignment: 'right' });
      } else {
        row.push('');
      }
      row.push(
        [{ text: `${upgrade.name} with ${upgrade.shingle}: `, bold: true, alignment: 'right' }],
        [{ text: formatCurrency(upgrade.value, 'en-US', '$') }]
      );
      upgradeTotals.push(row);
    });
    //Optionals
    var optionalsTotals = [];
    if (optionsList.length == 0) {
      optionalsTotals.push([
        [{ text: 'Optionals: ', bold: true, alignment: 'right' }],
        [{ text: '' }],
        [{ text: '' }]
      ]);
    }
    optionsList.forEach((option, index) => {
      var row = [];
      if (index == 0) {
        row.push({ text: 'Optionals: ', bold: true, alignment: 'right' });
      } else {
        row.push('');
      }
      row.push(
        [
          { text: `${option.name}: `, bold: true, alignment: 'right' },
          { text: `${option.description}: `, alignment: 'right' }
        ],
        [{ text: option.total }]
      );
      optionalsTotals.push(row);
    });

    let sowText = scope?.scope_of_work?.split('- ') ?? '';

    //Set Job text
    let jobType = await this.getJobType(shingleTrademarks, building);

    let docDefinition = {
      pageMargins: [40, 20, 40, 60],
      content: [
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [tableLogos, ['', '', '', '']]
          }
        },
        {
          columns: [{
            //split text
            text: [
              { text: 'Proposal ', style: ['proposal'] }
            ],
            style: ['columnsStyle']
          },
          { text: this.datePdf, alignment: 'right', style: ['proposalMin'] },
          ]
        },
        {
          columns: [
            //paragraphs
            [`Customer Name: ${this.stName}`, `Job Address: ${this.stAddress}`],
            [{ text: this.stPhone, alignment: 'right' },
            { text: this.stEmail, alignment: 'right' }]
          ],
          style: ['columnsStyle']
        },
        {
          //split text
          text: [{ text: 'Job: ' }, { text: jobType }],
          style: ['fontSizeText', 'columnsStyle']
        },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [[''], ['']]
          }
        },
        {
          //split text
          text: [
            { text: 'Scope of work/ Building: ' },
            { text: building.building.description }
          ],
          style: ['scopeWork', 'columnsStyle']
        },
        {
          // to treat a paragraph as a bulleted list, set an array of items under the ul key
          ul: sowText,
          style: ['columnsStyle'],
          pageBreak: 'after'
        },
        //page 2
        {
          columns: [{
            //split text
            text: [
              { text: 'Proposal ', style: ['proposal'] }
            ],
            style: ['columnsStyle']
          },
          { text: this.datePdf, alignment: 'right', style: ['proposalMin'] },
          ]
        },
        {
          columns: [
            //paragraphs
            [`Customer Name: ${this.stName}`, `Job Address: ${this.stAddress}`],
            [{ text: this.stPhone, alignment: 'right' },
            { text: this.stEmail, alignment: 'right' }]
          ],
          style: ['columnsStyle']
        },
        {
          //split text
          text: [{ text: 'Job: ' }, { text: jobType }],
          style: ['fontSizeText', 'columnsStyle']
        },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [[''], ['']]
          }
        },
        {
          columns: colorPdf,
          style: ['columnsStyle']
        },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [[''], ['']]
          }
        },
        //Total
        {
          layout: 'noBorders',
          table: {
            headerRows: 1,
            widths: [130, 300, 'auto'],
            body: amountTotals,
            alignment: 'rigth'
          }
        },
        {
          columns: [
            {
              text: '____________________________________________________________________',
              alignment: 'right',
              color: '#979797'
            }
          ]
        },
        //Upgrade
        {
          layout: 'noBorders',
          table: {
            headerRows: 1,
            widths: [130, 300, 'auto'],
            body: upgradeTotals,
            alignment: 'rigth'
          }
        },
        {
          columns: [
            {
              text: '____________________________________________________________________',
              alignment: 'right',
              color: '#979797'
            }
          ]
        },
        //Optionals
        {
          layout: 'noBorders',
          table: {
            headerRows: 1,
            widths: [130, 300, 'auto'],
            body: optionalsTotals,
            alignment: 'rigth'
          }
        },
        {
          columns: [
            //paragraphs
            [
              {
                text:
                  'Terms: All accounts due and payable 10 days from date work is completed.  A finance charge of ' +
                  '1 ½ per month which is 18% per annum will be charged on the unpaid balance of past due accounts.' +
                  'Customer agrees to pay a reasonable attorney’s fee and other costs of collection after default ' +
                  'and referral to an attorney. A 15% restocking fee will be charged if job is canceled without notice. ',
                alignment: 'center',
                fontSize: 8
              },
              {
                text:
                  'A 3.5% processing fee will be charged on all credit/debit card payments. Excludes: Unforeseen removal or '+
                  'cutting of siding, mold remediation, framing, roof deck, fascia, soffit, gutters, metal trims, HVAC, '+
                  'snow removal, and any damage due to vibrations, damages to existing skylight and sheet rock.',
                alignment: 'center',
                fontSize: 8,
                bold: true
              }
            ]
          ],
          style: ['columnsStyle'],
          marginTop: 100
        },
        {
          columns: [
            //paragraphs
            [
              {
                text: 'Thank you for choosing E&H Roofing for all your roofing needs',
                alignment: 'center',
                bold: true
              },
              {
                text: `Proposal valid for ${this.proposalValid} days`,
                alignment: 'center',
                bold: true
              }
            ]
          ],
          style: ['columnsStyle']
        }
      ],
      footer: function (currentPage) {
        return [
          {
            text: currentPage == 1 ? footerText : '',
            bold: true,
            marginLeft: 35,
            alignment: 'center'
          },
          {
            layout: 'lightHorizontalLines',
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto'],
              body: [
                ['', '', ''],
                [
                  [
                    { text: 'Office contact: # (208) 608-5569', style: ['footerText'] },
                    { text: 'office@ehroofing.com', style: ['footerNetwork'] }
                  ],
                  [
                    {
                      text: 'Adress: 9530 S Powerline Rd, Nampa, ID 83686',
                      style: ['footerText']
                    },
                    { text: 'www.ehroofing.com', style: ['footerNetwork'] }
                  ],
                  [
                    {
                      image: logo4,
                      width: 60
                    }
                  ]
                ]
              ]
            },
            style: ['tableStyles']
          }
        ]
      },
      //css
      styles: {
        proposal: {
          fontSize: 22,
          bold: true
        },
        proposalMin: {
          fontSize: 16,
          bold: true
        },
        columnsStyle: {
          marginTop: 10
        },
        fontSizeText: {
          fontSize: 12
        },
        scopeWork: {
          fontSize: 17,
          bold: true
        },
        footerText: {
          fontSize: 12,
          bold: true
        },
        footerNetwork: {
          color: '#007aff',
          bold: true
        },
        tableStyles: {
          marginLeft: 40,
          marginRight: 10
        }
      }
    };

    this.pdfObject = pdfMake.createPdf(docDefinition);
    if (this.platform.is('cordova')) {
      this.pdfObject.getBuffer(buffer => {
        var blob = new Blob([buffer], { type: 'application/pdf' });
        var path;

        if (this.platform.is('ios')) {
          path = this.file.documentsDirectory;
        } else if (this.platform.is('android')) {
          path = this.file.externalDataDirectory;
        }

        this.file
          .writeFile(
            path,
            'Proposal_' + building.building.id + '_' + type + '.pdf',
            blob,
            { replace: true }
          )
          .then(entry => {
            this.urlpath = `${path}Proposal_${building.building.id}_${type}.pdf`;
            let win: any = window;
            var myURL = win.Ionic.WebView.convertFileSrc(this.urlpath);
            this.pdfs.push({
              idBuilding: building.building.id,
              type: type,
              urlPDF: myURL,
              file: this.urlpath
            });
          });
      });

      return true;
    }
    this.pdfObject.open();
  }

  selectPage(selectedPage) {
    if (selectedPage) {
      if (this.page < this.totalPages) {
        this.page++;
      }
    } else {
      if (this.page > 1) {
        this.page--;
      }
    }
  }

  getPdfs() {
    if (this.pdfs.length == 0) {
      setTimeout(() => {
        this.getPdfs();
      }, 1000);
      return;
    }
    this.buildingOp[0].id;
    let init = this.pdfs.find(
      pdf => pdf.idBuilding == this.buildingOp[0].id && pdf.type == this.typeTxt
    );
    if (init != undefined) {
      this.pdfSrc = init.urlPDF;
    }
    this.loading.dismiss();
  }

  afterLoadComplete(pdf: PDFDocumentProxy) {
    this.page = 1;
    this.totalPages = pdf._pdfInfo.numPages;
  }

  getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');

      img.onload = () => {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = error => {
        reject(error);
      };
      img.src = url;
    });
  }

  async openEmailClient() {
    this.catalogGeneral = await this.catalogsService.getGeneral().then(resp => {
      return resp.data;
    });

    let projectAddress = `${this.project.st_address}`;

    let projectInspector = `${this.project.user_saleman.contact.first_name} ${this.project.user_saleman.contact.last_name}`;

    let mailSubject = this.catalogGeneral.find(e => e.key == 'mail_subject').value;
    let mailCc = this.catalogGeneral.find(e => e.key == 'mail_cc').value.split(', ');
    let mailCco = this.catalogGeneral.find(e => e.key == 'mail_cco').value.split(', ');
    let replace = {
      Customer: `${this.project.contact_address.contact.first_name} ${this.project.contact_address.contact.last_name}`
    };
    let mailBody = this.replaceTxt(
      this.catalogGeneral.find(e => e.key == 'mail_body').value,
      replace
    );

    mailSubject = mailSubject.replace('[ProjectAddress]', projectAddress);
    mailBody = mailBody.replace('[Inspector_name]', projectInspector);

    let mailArray = [];
    this.project.contact_address.contact.emails.forEach(element => {
      mailArray.push(element.email);
    });
    let mailTo = mailArray.length != 0 ? mailArray : '';

    if (this.platform.is('cordova')) {
      let attachments = [];
      this.pdfs.forEach(pdf => {
        attachments.push(pdf.file);
      });

      //let app;
      this.emailComposer.getClients().then(apps => {
        //app = apps[0];
        //this.emailComposer.addAlias('main', app);
        let email = {
          to: mailTo,
          cc: mailCc,
          bcc: mailCco,
          attachments: attachments,
          subject: mailSubject,
          body: mailBody,
          isHtml: true
        };
        this.emailComposer.open(email);
      });
    }
    this.canChangeStatus = true;
  }

  replaceTxt(txt, values = {}) {
    var RegExPattern = /\{(\w+)\}/g;
    return txt.replace(RegExPattern, function (token, key) {
      return values[key];
    });
  }

  async openPopover(ev, op) {
    const _typeOp = this.typeOp.filter(op => op.active);
    const modal = await this.popoverController.create({
      component: PopoverOptionsListComponent,
      cssClass: '',
      event: ev,
      side: 'bottom',
      componentProps: {
        options: op == 1 ? this.buildingOp : _typeOp
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (!data) {
      return;
    }
    const popOverOpSelected = this.typeOp.find(op => op.id == data.id);
    if (op == 1) {
      this.buildinTxt = data.option;
    } else {
      this.typeTxt = popOverOpSelected.option;
    }
    this.page = 1;
    if (this.pdfs.length > 0) {
      this.pdfSrc = this.pdfs.find(
        pdf =>
          pdf.idBuilding == this.buildingOp.find(b => b.selected).id &&
          pdf.type == this.typeOp.find(t => t.selected).option
      ).urlPDF;
    }
  }

  formatDate(date) {
    const month = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'Octuber',
      'November',
      'December'
    ];
    const day = [
      '',
      '1st',
      '2nd',
      '3rd',
      '4th',
      '5th',
      '6th',
      '7th',
      '8th',
      '9th',
      '10th',
      '11th',
      '12th',
      '13th',
      '14th',
      '15th',
      '16th',
      '17th',
      '18th',
      '19th',
      '20th',
      '21st',
      '22nd',
      '23rd',
      '24th',
      '25th',
      '26th',
      '27th',
      '28th',
      '29th',
      '30th',
      '31st'
    ];
    var newDate = `${month[date.getMonth()]} ${day[date.getDate()]
      } ${date.getFullYear()}`;
    return newDate;
  }

  changeProjectStatus() {
    const project_status = { id: 3, project_status: 'Estimate sent' };
    this.project = {
      ...this.project,
      project_status,
      id_project_status: 3,
      st_project_status: project_status.project_status,
      isModified: true
    };
    this.projectService.update(this.project.id, this.project);

    setTimeout(() => {
      this.synProjects.syncOffline();
      this.navController.navigateForward('home/prospecting');
    }, 500);
  }
}
