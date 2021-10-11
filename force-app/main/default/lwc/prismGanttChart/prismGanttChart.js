import { LightningElement, api, track, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import momentJS from "@salesforce/resourceUrl/momentJS";
import { loadScript } from "lightning/platformResourceLoader";

import getChartData from "@salesforce/apex/prism_ganttChartCtrlr.getChartData";
import getProjects from "@salesforce/apex/prism_ganttChartCtrlr.getProjects";
import getResources from "@salesforce/apex/prism_ganttChartCtrlr.getResources";


//COmparable gantt chart?
export default class prismGanttChart extends LightningElement {
  @api recordId;
  @api objectForView='Resource_Engagement__c'; // to hold the object where gantt chart is displayed
  @track isAllocatedItemView;
  @track isProjectView;
  @track inited=false;
  // design attributes
  @api defaultView;
  @api allocatedItemApiName='Contact'; 
  @api allocatedItemLabel='Resource'; 
  @api allocatedItemPluralLabel='Resources'; 
  @api projectApiName='Project__c'; 
  @api projectLabel='Project'; 
  @api projectPluralLabel='Projects'; 
  @api junctionObjectApiName='Resource_Engagement__c';
  @api startDateFieldApi='Start_Date_of_Engagement__c'; 
  @api endDateFieldApi='End_Date_of_Engagement__c'; 
  @api projectFieldApiName='Project__c';
  @api allocatedItemFieldApiName='Resource__c';
  @api junctionStatusFieldApiName='Status__c';
  @api queryOrderBy;
  @api projectsToFilter='';
  @api filterString='';
  @api filterStringToGetResources='';
  @api filterStringToGetProjects='';
  @api allocatedItemFieldsToQuery='Name,Level__c,Start_Date__c';
  @api projectFieldsToQuery='Name,Department__c,Effort__c,Client__c,Funding_Source__c,Impact__c,Priority__c,Program__c,Project_Manager__c,Start_Date__c,Status__c,Version__c';
  @api junctionFieldsToQuery='Name,Project__c,Resource__c,Start_Date_of_Engagement__c,End_Date_of_Engagement__c,Team__c,Status__c,Hours_Engaged__c,Engaged_Days__c';
  @api junctionFieldsToEdit='Team__c,Status__c,Hours_Engaged__c,Engaged_Days__c'; //except project,resources and startdate & end date fields.
  @api allocatedItemSubHeader='Level__c';
  @api allocationItemsToFilter='';
  @api junctionRecordsToFilter='';
  @api junctionFieldToFilter='';


  @api readOnly=false;
  @api disableFilter=false;
  @api disableView=false;
  @track disableFilterFlag;
  @track disableViewFlag;
  @api inputFields=[{ label: "Name",
                    api: "Name",
                    value: "",
                    maxLength: 80,
                    minLength: 0,
                    isRequired: true,
                    key: "farLookupNewName",
                    type: "text",
                    display:false}];
                    
  @api isToCompareProjects=false;
  // navigation
  @track startDateUTC; // sending to backend using time
  @track endDateUTC; // sending to backend using time
  @track formattedStartDate; // Title (Date Range)
  @track formattedEndDate; // Title (Date Range)
  @track dates = []; // Dates (Header)
  @track needsRefresh=false;
  dateShift = 7; // determines how many days we shift by
  // options
  @track datePickerString; // Date Navigation
  @track view = {
    // View Select
    options: [
      {
        label: "View by Day",
        value: "1/14"
      },
      {
        label: "View by Week",
        value: "7/10"
      },
      {
        label: "View by Month",
        value: "7/54"
      }
    ],
    slotSize: 1,
    slots: 1
  };
  /*** Modals ***/
  

  @track resourceModalData = {};
  /*** /Modals ***/
  // gantt_chart_resource
  @track startDate;
  @track endDate;
  @track projectId;
  @track resources = [];
  @track displayFilter=false;
  constructor() {
    super();
    this.template.addEventListener("click", this.closeDropdowns.bind(this));
  }
  get orderby(){
    return this.setOrderBy();
  }
  get currentobjectAPI(){
    let retVal=this.junctionObjectApiName;
    if(this.isAllocatedItemView){
      retVal=this.allocatedItemApiName;
    }else if(this.isProjectView){
      retVal=this.projectApiName;
    }
    return retVal;

  }

  setOrderBy(){
    let retVal= this.queryOrderBy;
    if(retVal){
      return retVal;
    }else{
      retVal= ' ORDER BY '+(this.allocatedItemFieldApiName.replace('__c','__r'))+'.Name,'+(this.projectFieldApiName.replace('__c','__r'))+'.Name NULLS FIRST,'+ this.startDateFieldApi;
    }
    return retVal;
  }
  connectedCallback() {
    Promise.all([
      loadScript(this, momentJS)
    ]).then(() => {
      switch (this.defaultView) {
        case "View by Day":
          this.setView("1/14");
          break;
        case "View by Month":
          this.setView("7/54");
          break;
        default:
          this.setView("7/10");
      }
      this.disableFilterFlag=this.disableFilter;
      this.disableViewFlag=this.disableView;
      this.setStartDate(new Date());
      this.handleRefresh();
      this.inited=true;
    });

  }
  handleRefreshEvt(){
    this.inited=false;
    this.handleRefresh();
  }
  // catch blur on allocation menus
  closeDropdowns() {
    Array.from(
      this.template.querySelectorAll(".lwc-resource-component")
    ).forEach(row => {
      row.closeAllocationMenu();
    });
  }
  /*** Navigation ***/
  setStartDate(_startDate) {
    if (_startDate instanceof Date && !isNaN(_startDate)) {
      _startDate.setHours(0, 0, 0, 0);
      this.datePickerString = _startDate.toISOString();
      this.startDate = moment(_startDate)
        .day(1)
        .toDate();
      this.startDateUTC =
        moment(this.startDate)
          .utc()
          .valueOf() -
        moment(this.startDate).utcOffset() * 60 * 1000 +
        "";
      this.formattedStartDate = this.startDate.toLocaleDateString();
      this.setDateHeaders();
    } else {
      this.dispatchEvent(
        new ShowToastEvent({
          message: "Invalid Date",
          variant: "error"
        })
      );
    }
  }
  setDateHeaders() {
    this.endDate = moment(this.startDate)
      .add(this.view.slots * this.view.slotSize - 1, "days")
      .toDate();
    this.endDateUTC =
      moment(this.endDate)
        .utc()
        .valueOf() -
      moment(this.endDate).utcOffset() * 60 * 1000 +
      "";
    this.formattedEndDate = this.endDate.toLocaleDateString();
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    today = today.getTime();
    let dates = {};
    for (let date = moment(this.startDate); date <= moment(this.endDate); date.add(this.view.slotSize, "days")) {
      let index = date.format("YYYYMM");
      if (!dates[index]) {
        dates[index] = {
          dayName: '',
          name: date.format("MMMM"),
          days: []
        };
      }
      let day = {
        class: "slds-col slds-p-vertical_x-small slds-m-top_x-small lwc-timeline_day",
        label: date.format("M/D"),
        start: date.toDate()
      };
      if (this.view.slotSize > 1) {
        let end = moment(date).add(this.view.slotSize - 1, "days");
        day.end = end.toDate();
      } else {
        day.end = date.toDate();
        day.dayName = date.format("ddd");
        if (date.day() === 0) {
          day.class = day.class + " lwc-is-week-end";
        }
      }
      if (today >= day.start && today <= day.end) {
        day.class += " lwc-is-today";
      }
      dates[index].days.push(day);
      dates[index].style =
        "width: calc(" +
        dates[index].days.length +
        "/" +
        this.view.slots +
        "*100%)";
    }
    // reorder index
    this.dates = Object.values(dates);
    Array.from(
      this.template.querySelectorAll("c-gantt_chart_resource")
    ).forEach(resource => {
      resource.refreshDates(this.startDate, this.endDate, this.view.slotSize);
    });
  }
  navigateToToday() {
    this.setStartDate(new Date());
    this.handleRefresh();
  }
  navigateToPrevious() {
    let _startDate = new Date(this.startDate);
    _startDate.setDate(_startDate.getDate() - this.dateShift);
    this.setStartDate(_startDate);
    this.handleRefresh();
  }
  navigateToNext() {
    let _startDate = new Date(this.startDate);
    _startDate.setDate(_startDate.getDate() + this.dateShift);
    this.setStartDate(_startDate);
    this.handleRefresh();
  }
  navigateToDay(event) {
    this.setStartDate(new Date(event.target.value + "T00:00:00"));
    this.handleRefresh();
  }
  setView(value) {
    let values = value.split("/");
    this.view.value = value;
    this.view.slotSize = parseInt(value[0], 10);
    this.view.slots = parseInt(values[1], 10);
  }
  handleViewChange(event) {
    this.setView(event.target.value);
    this.setDateHeaders();
    this.handleRefresh();
  }
  /*** /Navigation ***/
  /*** Resource Modal ***/ //?????????????????????????????????????????????????????????????
  openAddResourceModal() {
    window.console.log('Resources = ' + JSON.stringify(getResources()));
    getResources()
      .then(resources => {
        let excludeResources = this.resources;
        this.resourceModalData = {
          disabled: true,
          resources: resources
            .filter(resource => {
              return (
                excludeResources.filter(excludeResource => {
                  return excludeResource.Id === resource.Id;
                }).length === 0
              );
            })
            .map(resource => {
              return {
                label: resource.Name,
                value: resource.Id,
                role: resource.Default_Role__c
              };
            })
        };
        window.console.log('Post Resources = ' + JSON.stringify(this.resourceModalData));
        this.template.querySelector(".resource-modal").show();
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            message: error.body.message,
            variant: "error"
          })
        );
      });
  }
  handleResourceSelect(event) { //?????????????????????????????????????????????????????????????
    let self = this;
    self.resourceModalData.resources.forEach(resource => {
      if (resource.value === event.target.value) {
        self.resourceModalData.resource = {
          Id: resource.value,
          Name: resource.label,
          Default_Role__c: resource.role
        };
      }
    });
    this.validateResourceModalData();
  }
  validateResourceModalData() { //?????????????????????????????????????????????????????????????
    if (!this.resourceModalData.resource) {
      this.resourceModalData.disabled = true;
    } else {
      this.resourceModalData.disabled = false;
    }
  }
  addResourceById() { //?????????????????????????????????????????????????????????????
    let newResource = Object.assign({}, this.resourceModalData.resource);
    newResource.allocationsByProject = [];
    this.resources = this.resources.concat([newResource]);
    this.template.querySelector(".resource-modal").hide();
    this.resourceModalData = {
      disabled: true,
      resources: []
    };
  }
  /*** /Resource Modal ***/
  /*** Filter Modal ***/
  stopProp(event) {
    event.stopPropagation();
  }
  clearFocus() {
    this.filterModalData.focus = null;
  }
  openFilterModal() {
    /*if(!this.disableFilterFlag){
      this.filterModalData.projects = Object.assign(
        [],
        this._filterData.projects
      );
      this.filterModalData.roles = Object.assign([], this._filterData.roles);
      this.filterModalData.status = this._filterData.status;*/
      //this.template.querySelector(".filter-modal").show();
      this.displayFilter=true;
    //}
    
  }
  filterProjects(event) {
    this.hideDropdowns();
    let text = event.target.value;
    getProjects().then(projects => {
      // only show projects not selected
      this.filterModalData.projectOptions = projects.filter(project => {
        return (
          project.Name &&
          project.Name.toLowerCase().includes(text.toLowerCase()) &&
          !this.filterModalData.projects.filter(p => {
            return p.id === project.Id;
          }).length
        );
      });
      this.filterModalData.focus = "projects";
    });
  }
  // Mohit's filter by record type
  filterProjectRecords(event) {
    this.hideDropdowns();
  
    let text = event.target.value;
  
    getProjects().then(projects => {
      // only show projects not selected
      this.filterModalData.projectRecordTypeOptions = projects.filter(project => {
        return (
          project.RecordTypeId &&
          !this.filterModalData.projects.filter(p => {
            return p.id === project.RecordTypeId;
          }).length
        );
      });
      this.filterModalData.focus = "projectRecordTypeOptions";
    });
  }
  
  addProjectFilter(event) {
    this.filterModalData.projects.push(
      Object.assign({}, event.currentTarget.dataset)
    );
    this.filterModalData.focus = null;
    this.setFilterModalDataDisable();
  }
  // Mohit's addProjectRecordTypeFilter 
  addProjectRecordTypeFilter(event) {
    this.filterModalData.projectRecordTypes.push(
      Object.assign({}, event.currentTarget.dataset)
    );
    this.filterModalData.focus = null;
    this.setFilterModalDataDisable();
  }
  removeProjectFilter(event) {
    this.filterModalData.projects.splice(event.currentTarget.dataset.index, 1);
    this.setFilterModalDataDisable();
  }
  filterRoles(event) {
    this.hideDropdowns();
    let text = event.target.value;
    // only show roles not selected
    this.filterModalData.roleOptions = this.roles
      .filter(role => {
        return (
          role.toLowerCase().includes(text.toLowerCase()) &&
          !this.filterModalData.roles.filter(r => {
            return r === role;
          }).length
        );
      })
      .map(role => {
        return role;
      });
    this.filterModalData.focus = "roles";
  }

  addRoleFilter(event) {
    this.filterModalData.roles.push(event.currentTarget.dataset.role);
    this.filterModalData.focus = null;
    this.setFilterModalDataDisable();
  }

  removeRoleFilter(event) {
    this.filterModalData.roles.splice(event.currentTarget.dataset.index, 1);
    this.setFilterModalDataDisable();
  }

  setStatusFilter(event) {
    this.filterModalData.status = event.currentTarget.value;
    this.setFilterModalDataDisable();
  }

  clearFilters() {
    this.filterModalData.projects = [];
    this.filterModalData.roles = [];
    this.filterModalData.status = "";
    this.filterModalData.disabled = true;
  }

  setFilterModalDataDisable() {
    this.filterModalData.disabled = true;

    if (
      this.filterModalData.projects.length > 0 ||
      this.filterModalData.roles.length > 0 ||
      this.filterModalData.status !== ""
    ) {
      this.filterModalData.disabled = false;
    }
  }

  hideDropdowns() {
    // prevent menu from closing if focused
    if (this.filterModalData.focus) {
      return;
    }
    /*this.filterModalData.projectOptions = [];
    this.filterModalData.roleOptions = [];*/
  }


  

  handleRefresh() {
    this.resources=[];
    // refreshApex(this.wiredData);
    let self = this;
    let Obj={};
        this.needsRefresh=true;
        Obj.recordId=this.recordId;
        Obj.objectForView=this.objectForView;
        Obj.defaultView=this.defaultView;
        Obj.allocatedItemApiName=this.allocatedItemApiName; 
        Obj.allocatedItemLabel=this.allocatedItemLabel; 
        Obj.allocatedItemPluralLabel=this.allocatedItemPluralLabel; 
        Obj.projectApiName=this.projectApiName; 
        Obj.projectLabel=this.projectLabel;
        Obj.projectPluralLabel=this.projectPluralLabel; 
        Obj.junctionObjectApiName=this.junctionObjectApiName;
        Obj.startDateFieldApi=this.startDateFieldApi;
        Obj.endDateFieldApi=this.endDateFieldApi;
        Obj.projectFieldApiName=this.projectFieldApiName;
        Obj.allocatedItemFieldApiName=this.allocatedItemFieldApiName;
        Obj.orderBy=this.setOrderBy();
        Obj.projectsToFilter=this.projectsToFilter;
        Obj.filterString=this.filterString;
        Obj.filterStringToGetResources=this.filterStringToGetResources;
        Obj.filterStringToGetProjects=this.filterStringToGetProjects;
        Obj.allocatedItemFieldsToQuery=this.allocatedItemFieldsToQuery;
        Obj.projectFieldsToQuery=this.projectFieldsToQuery;
        Obj.junctionFieldsToQuery=this.junctionFieldsToQuery;
        Obj.allocatedItemSubHeader=this.allocatedItemSubHeader;
        Obj.allocationItemsToFilter=this.allocationItemsToFilter;
        Obj.junctionRecordsToFilter=this.junctionRecordsToFilter;
        Obj.junctionFieldToFilter=this.junctionFieldToFilter;
        Obj.startTime= this.startDateUTC;
        Obj.endTime= this.endDateUTC;
        Obj.slotSize= this.view.slotSize;

    getChartData({
      inputJSON: JSON.stringify(Obj)
    }).then(data => {
      this.isAllocatedItemView = typeof self.objectForView !== 'undefined' && self.objectForView.endsWith(this.allocatedItemApiName);
      this.isProjectView = typeof self.objectForView !== 'undefined' && self.objectForView.endsWith(this.projectApiName);
      this.projectId = data.projectId;
      this.projects = data.projects;
      this.roles = data.allocatedItemSubHeaderValues;
      data.allocatedItems.forEach(function (resource, i) {
          resource.additionalInfo= resource.allocatedItemSubHeader;
      });
      this.resources=data.allocatedItems; 
      this.needsRefresh=false;
    }).catch(error => {
        this.dispatchEvent(new ShowToastEvent({
            message: error.body.message,
            variant: 'error'
        }));
        this.needsRefresh=false;
    });
    this.inited=true;
  }
  handlefilterUpdate(event){
    let evt=event.detail; //???????????????? Need to update
    this.displayFilter=false;
  }
  handlefilterUpdateSuccess(event){
    this.inited=false;
    let evt=event.detail?.objectData; 
    const regex = /^-?[\d.]+(?:e-?\d+)?$/;
    let fltr='';
    
    evt?.forEach((obj,indx) => {
      let str='';
      if(obj.filterLogic){
        for (var i = 0; i < obj.filterLogic.length; i++) {
          if(regex.test(obj.filterLogic.charAt(i))){
            str+= obj.apiConditions[parseInt(obj.filterLogic.charAt(i))];
          }else{
            str+= obj.filterLogic.charAt(i);
          }
        }
      }else if(obj.apiConditions){
        str+= obj.apiConditions.join(' AND ');
      }
      /*if(fltr=='') {
        fltr+=str;
      }else{
        fltr=fltr+' AND '+str;
      }*/
      if(obj.api == this.projectApiName && str!=''){
        this.filterStringToGetProjects=str;//this.filterStringToGetProjects? this.filterStringToGetProjects+' AND ( '+str+' ) ':str; 
      }
      else if(obj.api == this.allocatedItemApiName && str!=''){
        this.filterStringToGetResources=str;//this.filterStringToGetResources? this.filterStringToGetResources+' AND ( '+str+' ) ':str; 
      }
      else if(obj.api == this.junctionObjectApiName && str!=''){
        this.filterString=str;//this.filterString? this.filterString+' AND ( '+str+' ) ':str; 
      }
    }); 
    this.displayFilter=false;
    setTimeout(() => {
        this.handleRefresh();
    }, 1000);
  }
  updateAllocatedItemsOnResources(allocations){
    allocations
  }
  
  @track filterOperators={
    "date" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEqual",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    } ],
    "datetime" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEqual",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    } ],
    "string" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    }, {
      "label" : "contains",
      "name" : "contains",
      "symbol" : "LIKE"
    }, {
      "label" : "does not contain",
      "name" : "notContain",
      "symbol" : "NOT LIKE"
    }, {
      "label" : "starts with",
      "name" : "startsWith",
      "symbol" : "%LIKE"
    } ],
    "double" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    } ],
    "picklist" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    }, {
      "label" : "contains",
      "name" : "contains",
      "symbol" : "LIKE"
    }, {
      "label" : "does not contain",
      "name" : "notContain",
      "symbol" : "NOT LIKE"
    }, {
      "label" : "starts with",
      "name" : "startsWith",
      "symbol" : "%LIKE"
    } ],
    "textarea" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    }, {
      "label" : "contains",
      "name" : "contains",
      "symbol" : "LIKE"
    }, {
      "label" : "does not contain",
      "name" : "notContain",
      "symbol" : "NOT LIKE"
    }, {
      "label" : "starts with",
      "name" : "startsWith",
      "symbol" : "%LIKE"
    } ],
    "percent" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    } ],
    "url" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<="
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    }, {
      "label" : "contains",
      "name" : "contains",
      "symbol" : "LIKE"
    }, {
      "label" : "does not contain",
      "name" : "notContain",
      "symbol" : "NOT LIKE"
    }, {
      "label" : "starts with",
      "name" : "startsWith"
    } ],
    "integer" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
      
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    } ],
    "reference" : [ {
      "label" : "equals",
      "name" : "equals",
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals", 
      "symbol" : "!="
    } ],
    "boolean" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals", 
      "symbol" : "!="
    } ],
    "phone" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals", 
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    }, {
      "label" : "contains",
      "name" : "contains",
      "symbol" : "LIKE"
    }, {
      "label" : "does not contain",
      "name" : "notContain",
      "symbol" : "NOT LIKE"
    }, {
      "label" : "starts with",
      "name" : "startsWith",
      "symbol" : "%LIKE"
    } ],
    "currency" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals", 
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    } ],
    "id" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals",
      "symbol" : "!="
    }, {
      "label" : "starts with",
      "name" : "startsWith",
      "symbol" : "%LIKE"
    } ],
    "email" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals", 
      "symbol" : "!="
    }, {
      "label" : "less than",
      "name" : "lessThan",
      "symbol" : "<"
    }, {
      "label" : "greater than",
      "name" : "greaterThan",
      "symbol" : ">"
    }, {
      "label" : "less or equal",
      "name" : "lessOrEqual",
      "symbol" : "<="
    }, {
      "label" : "greater or equal",
      "name" : "greaterOrEqual",
      "symbol" : ">="
    }, {
      "label" : "contains",
      "name" : "contains",
      "symbol" : "LIKE"
    }, {
      "label" : "does not contain",
      "name" : "notContain",
      "symbol" : "NOT LIKE"
    }, {
      "label" : "starts with",
      "name" : "startsWith",
      "symbol" : "%LIKE"
    } ],
    "multipicklist" : [ {
      "label" : "equals",
      "name" : "equals", 
      "symbol" : "="
    }, {
      "label" : "not equal to",
      "name" : "notEquals", 
      "symbol" : "!="
    }, {
      "label" : "includes",
      "name" : "includes",
      "symbol" : "IN"
    }, {
      "label" : "excludes",
      "name" : "excludes",
      "symbol" : "NOT IN"
    } ]
  };
}