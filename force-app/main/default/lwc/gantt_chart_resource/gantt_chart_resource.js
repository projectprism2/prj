import { LightningElement, api, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import getProjects from "@salesforce/apex/prism_ganttChartCtrlr.getProjects";
import saveAllocation from "@salesforce/apex/prism_ganttChartCtrlr.saveAllocation";
import deleteAllocation from "@salesforce/apex/prism_ganttChartCtrlr.deleteAllocation";
import { deleteRecord } from 'lightning/uiRecordApi';
export default class GanttChartResource extends LightningElement {
  @api isResourceView; // resource page has different layout
  @api projectId; // used on project page for quick adding of allocations
  @api projectFieldsToQuery;
  @api projectApiName;
  @api filterStringToGetProjects;
  @api junctionObjectApiName;
  @api inputFields;
  @api startDateFieldApi='Start_Date_of_Engagement__c'; 
  @api endDateFieldApi='End_Date_of_Engagement__c'; 
  @api projectFieldApiName='Project__c';
  @api allocatedItemFieldApiName='Resource__c';
  @api junctionStatusFieldApiName='Status__c';
  @api junctionFieldsToEdit='Team__c,Status__c,Hours_Engaged__c,Engaged_Days__c';
  @api filterOperators;

  @track resource;
  @track inited=false;
  @track selectedAllocation;
  @track displayBar=true;
  @track dragContainer;
  @track dragContainerOpacity;
  @track selectedStartDate;
  @track selectedEndDate;
  // dates
  @api startDate;
  @api endDate;
  @api dateIncrement;

  @api get inputResource(){
    return this.resource;
  }
  set inputResource(resObj){
    this.resource=JSON.parse(JSON.stringify(resObj));
    
  }
  get fieldApis(){
    let genFields=[this.projectFieldApiName,this.allocatedItemFieldApiName,this.startDateFieldApi,this.endDateFieldApi];
    let supportedFields=this.junctionFieldsToEdit? this.junctionFieldsToEdit.split(","):[];
    return genFields.concat(supportedFields);
  }
  fireRefresh(){
    const evtToFire = new CustomEvent("prismganttrefresh", {
      detail: {}
    });
    this.dispatchEvent(evtToFire);
  }
  handleSuccess(event) {
    event.preventDefault(); 
    this.displayEditRecord=false; 
    console.log('onsuccess event recordEditForm',event.detail.id);
    this.fireRefresh();
  }
  handleSubmit(event) {
    event.preventDefault();  
    this.displayEditRecord=false;
      console.log('onsubmit event recordEditForm'+ event.detail.fields);
  }
  handleCreateSuccess(event) {
    event.preventDefault();  
    this.displayNewRecord=false;
    console.log('onsuccess event recordEditForm',event.detail.id);
    this.fireRefresh();

  }
  handleCreateSubmit(event) {
    event.preventDefault();  
    this.displayNewRecord=false;
      console.log('onsubmit event recordEditForm'+ event.detail.fields);
      this.fireRefresh();
  }

  @api
  refreshDates(startDate, endDate, dateIncrement) {
    if (startDate && endDate && dateIncrement) {
      let times = [];
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      today = today.getTime();

      for (
        let date = new Date(startDate);
        date <= endDate;
        date.setDate(date.getDate() + dateIncrement)
      ) {
        let time = {
          class: "slds-col lwc-timeslot",
          start: date.getTime()
        };

        if (dateIncrement > 1) {
          let end = new Date(date);
          end.setDate(end.getDate() + dateIncrement - 1);
          time.end = end.getTime();
        } else {
          time.end = date.getTime();

          if (times.length % 7 === 6) {
            time.class += " lwc-is-week-end";
          }
        }

        if (today >= time.start && today <= time.end) {
          time.class += " lwc-is-today";
        }

        times.push(time);
      }

      this.times = times;
      this.startDate = startDate;
      this.endDate = endDate;
      this.dateIncrement = dateIncrement;
      this.setProjects();
    }
  }

  // used by parent level window
  @api
  closeAllocationMenu() {
    if (this.menuData.open) {
      this.menuData.show = true;
      this.menuData.open = false;
    } else {
      this.menuData = {
        show: false,
        open: false
      };
    }
    
  }

  // modal data
  @track addAllocationData = {};

  @track menuData = {
    open: false,
    show: false,
    style: ""
  };

  @track projects = [];

  effortOptions = [
    {
      label: "Low",
      value: "Low"
    },
    {
      label: "Medium",
      value: "Medium"
    },
    {
      label: "High",
      value: "High"
    }
  ];
  statusOptions = [
    {
      label: "Active",
      value: "Active"
    },
    {
      label: "Hold",
      value: "Hold"
    }
  ];

  connectedCallback() {
    //this.resource= JSON.parse(JSON.stringify(this.inputResource));
    //this.setProjects();
    this.refreshDates(this.startDate, this.endDate, this.dateIncrement);
    this.inited=true;
  }
  

  // calculate allocation classes
  calcClass(allocation) {
    let classes = ["slds-is-absolute", "lwc-allocation"];

    switch (allocation[this.junctionStatusFieldApiName]) {
      case "Unavailable": //Need rework as per requirements????? or MAKE IT CONFIGURABLE ?????????????????????????????????????
        classes.push("unavailable");
        break;
      case "Hold":
        classes.push("hold");
        break;
      case "Active":
          classes.push("active");
          break;
      case "InActive":
            classes.push("inactive");
            break;
      default:
        break;
    }
/*
    if ("Unavailable" !== allocation.Status__c) {
      switch (allocation.Effort__c) {
        case "Low":
          classes.push("low-effort");
          break;
        case "Medium":
          classes.push("medium-effort");
          break;
        case "High":
          classes.push("high-effort");
          break;
        default:
          break;
      }
    }
*/
    return classes.join(" ");
  }

  // calculate allocation positions/styles
  calcStyle(allocation) {
    if (!this.times) {
      return;
    }

    const totalSlots = this.times.length;
    let styles = [
      "left: " + (allocation.left / totalSlots) * 100 + "%",
      "right: " +
        ((totalSlots - (allocation.right + 1)) / totalSlots) * 100 +
        "%"
    ];

    if ("Unavailable" !== allocation[this.junctionStatusFieldApiName]) {
      const backgroundColor = allocation.color;
      const colorMap = {
        Blue: "#1589EE",
        Green: "#4AAD59",
        Red: "#E52D34",
        Turqoise: "#0DBCB9",
        Navy: "#052F5F",
        Orange: "#E56532",
        Purple: "#62548E",
        Pink: "#CA7CCE",
        Brown: "#823E17",
        Lime: "#7CCC47",
        Gold: "#FCAF32"
      };
      styles.push("background-color: " + colorMap[backgroundColor]);
    }

    if (!isNaN(this.dragInfo.startIndex)) {
      styles.push("pointer-events: none");
      styles.push("transition: left ease 250ms, right ease 250ms");
    } else {
      styles.push("pointer-events: auto");
      styles.push("transition: none");
    }

    return styles.join("; ");
  }

  // calculate allocation label position
  calcLabelStyle(allocation) {
    if (!this.times) {
      return;
    }

    const totalSlots = this.times.length;
    let left =
      allocation.left / totalSlots < 0 ? 0 : allocation.left / totalSlots;
    let right =
      (totalSlots - (allocation.right + 1)) / totalSlots < 0
        ? 0
        : (totalSlots - (allocation.right + 1)) / totalSlots;
    let styles = [
      "left: calc(" + left * 100 + "% + 15px)",
      "right: calc(" + right * 100 + "% + 30px)"
    ];

    if (!isNaN(this.dragInfo.startIndex)) {
      styles.push("transition: left ease 250ms, right ease 250ms");
    } else {
      styles.push("transition: none");
    }

    return styles.join("; ");
  }

  setProjects() {
    let self = this;
    self.projects = [];

    Object.keys(self.resource.allocationsByProject).forEach(projectId => {
      let project = {
        id: projectId,
        allocations: []
      };

      self.resource.allocationsByProject[projectId].forEach(allocation => {
        allocation.class = self.calcClass(allocation);
        allocation.style = self.calcStyle(allocation);
        allocation.labelStyle = self.calcLabelStyle(allocation);

        project.allocations.push(allocation);
      });

      self.projects.push(project);
    });
  }

  handleTimeslotClick(event) { 
    const start = new Date(parseInt(event.currentTarget.dataset.start, 10));
    const end = new Date(parseInt(event.currentTarget.dataset.end, 10));
    const st = event.currentTarget.dataset.start;
    const ed = event.currentTarget.dataset.end;
    const startUTC = start.getTime() + start.getTimezoneOffset() * 60 * 1000;
    const endUTC = end.getTime() + end.getTimezoneOffset() * 60 * 1000;
    this.selectedStartDate=startUTC;
    this.selectedEndDate=endUTC;
    if (this.projectId) {
      let newAllocation={};
      newAllocation.startDate= startUTC;
      newAllocation.endDate= endUTC;
      newAllocation.projectId=this.projectId;
      newAllocation.resourceId=this.resource.Id;
      this.upsertJunctionRecord(newAllocation);
    } else {
      let self = this;
      getProjects({
        queryFields: this.projectFieldsToQuery,
        projectApiName:this.projectApiName,
        filterStringToGetProjects: this.filterStringToGetProjects
      }).then(projects => {
          projects = projects.map(project => {
            return {
              value: project.Id,
              label: project.Name
            };
          });

          projects.unshift({
            value: "Unavailable",
            label: "Unavailable"
          });

          self.addAllocationData = {
            projects: projects,
            startDate: startUTC + "",
            endDate: endUTC + "",
            disabled: true,
            sDate:st.getDate,
            eDate:ed
          };
          this.displayNewRecord=true;
          //self.template.querySelector(".add-allocation-modal").show();
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
  }
  handleNewRecLoad(event){
    
   /* let dtl= { ...event.detail};
    if(this.startDateFieldApi && !dtl.record.fields[this.startDateFieldApi].value){
      let st=this.formatDate(this.selectedStartDate);
      //rec.fields[this.startDateFieldApi].displayValue=st;
      dtl.record.fields[this.startDateFieldApi].value=st;
    }
    if(this.startDateFieldApi && !dtl.record.fields[this.endDateFieldApi].value){
      let ed=this.formatDate(this.selectedEndDate);
      //rec.fields[this.endDateFieldApi].displayValue=ed;
      dtl.record.fields[this.endDateFieldApi].value=ed;
    }
    event.setParam('detail',dtl);*/
    //this.selectedStartDate=null;
    //this.selectedEndDate=null;
  }
  formatDate(dt) {
      console.log('formatDate');
      let d = new Date(dt);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      let year = d.getFullYear();

      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;
      return [year, month, day].join('-');
  }
  handleAddAllocationDataChange(event) { //need to rework ????????????????????????????????????????
    this.addAllocationData[event.target.dataset.field] = event.target.value;

    if (!this.addAllocationData.projectId) {
      this.addAllocationData.disabled = true;
    } else {
      this.addAllocationData.disabled = false;
    }
    this.template.querySelector(".add-allocation-modal").show();
    this.closeAllocationMenu();
  }

  addAllocationModalSuccess() { 
    if ("Unavailable" === this.addAllocationData.projectId) {
      this.addAllocationData.projectId = null;
      this.addAllocationData.status = "Unavailable";
    }
    let newAllocation={}; //??????????????????Should we support other fields????????????????????
    newAllocation.startDate= this.addAllocationData.startDate;
    newAllocation.endDate= this.addAllocationData.endDate;
    newAllocation.projectId=this.addAllocationData.projectId;
    newAllocation.resourceId=this.resource.Id;
    saveAllocation({
      junctionObjectApiName:this.junctionObjectApiName,
      inputFields:this.getInputFields(newAllocation)
    })
      .then(() => {
        this.selectedAllocation = {};
        this.template.querySelector(".add-allocation-modal").hide();
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

 

  /*** Drag/Drop ***/
  dragInfo = {};
  handleDragStart(event) {
    let container = this.template.querySelector(
      "." + event.currentTarget.dataset.id + " .lwc-allocation"
    );
    this.dragContainer=container;
    this.dragInfo.projectIndex = container.dataset.project;
    this.dragInfo.allocationIndex = container.dataset.allocation;
    this.dragInfo.newAllocation = this.projects[
      container.dataset.project
    ].allocations[container.dataset.allocation];

    //hide drag image
    //container.style.opacity = 0;
    setTimeout(function() {
      container.style.pointerEvents = "none";
    }, 0);
  }

  handleLeftDragStart(event) {
    this.dragInfo.direction = "left";
    this.handleDragStart(event);
  }

  handleRightDragStart(event) {
    this.dragInfo.direction = "right";
    this.handleDragStart(event);
  }

  handleDragEnd(event) {
    event.preventDefault();

    const projectIndex = this.dragInfo.projectIndex;
    const allocationIndex = this.dragInfo.allocationIndex;
    const newAllocation = this.dragInfo.newAllocation;
    this.projects = JSON.parse(JSON.stringify(this.projects));
    this.projects[projectIndex].allocations[allocationIndex] = newAllocation;
    let startDate = new Date(newAllocation[this.startDateFieldApi] + "T00:00:00");
    let endDate = new Date(newAllocation[this.endDateFieldApi] + "T00:00:00");
    newAllocation.startDate= startDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000 + "";
    newAllocation.endDate= endDate.getTime() + endDate.getTimezoneOffset() * 60 * 1000 + "";
    newAllocation.projectId=newAllocation[this.projectFieldApiName];
    newAllocation.resourceId=newAllocation[this.allocatedItemFieldApiName];
    this.upsertJunctionRecord(newAllocation);

    this.dragInfo = {};
    this.dragContainer.style.pointerEvents = "auto";
    /*this.template.querySelector(
      "." + allocation.Id + " .lwc-allocation"
    ).style.pointerEvents = "auto";*/
  }

  handleDragEnter(event) {
    const projectIndex = this.dragInfo.projectIndex;
    const allocationIndex = this.dragInfo.allocationIndex;
    const direction = this.dragInfo.direction;
    const start = new Date(parseInt(event.currentTarget.dataset.start, 10));
    const end = new Date(parseInt(event.currentTarget.dataset.end, 10));
    const index = parseInt(event.currentTarget.dataset.index, 10);

    if (isNaN(this.dragInfo.startIndex)) {
      this.dragInfo.startIndex = index;
    }

    let allocation = JSON.parse(
      JSON.stringify(this.projects[projectIndex].allocations[allocationIndex])
    );

    switch (direction) {
      case "left":
        if (index <= allocation.right) {
          allocation[this.startDateFieldApi] = start.toJSON().substr(0, 10);
          allocation.left = index;
        } else {
          allocation = this.dragInfo.newAllocation;
        }
        break;
      case "right":
        if (index >= allocation.left) {
          allocation[this.endDateFieldApi] = end.toJSON().substr(0, 10);
          allocation.right = index;
        } else {
          allocation = this.dragInfo.newAllocation;
        }
        break;
      default:
        let deltaIndex = index - this.dragInfo.startIndex;
        let firstSlot = this.times[0];
        let startDate = new Date(firstSlot.start);
        let endDate = new Date(firstSlot.end);

        allocation.left = allocation.left + deltaIndex;
        allocation.right = allocation.right + deltaIndex;

        startDate.setDate(
          startDate.getDate() + allocation.left * this.dateIncrement
        );
        endDate.setDate(
          endDate.getDate() + allocation.right * this.dateIncrement
        );

        allocation[this.startDateFieldApi] = startDate.toJSON().substr(0, 10);
        allocation[this.endDateFieldApi] = endDate.toJSON().substr(0, 10);
    }

    this.dragInfo.newAllocation = allocation;
    this.template.querySelector(
      "." + allocation.Id + " .lwc-allocation"
    ).style = this.calcStyle(allocation);
    this.template.querySelector(
      "." + allocation.Id + " .lwc-allocation-label"
    ).style = this.calcLabelStyle(allocation);
  }
  /*** /Drag/Drop ***/

  openAllocationMenu(event) {
    let container = this.template.querySelector(
      "." + event.currentTarget.dataset.id + " .lwc-allocation"
    );
    let allocation = this.projects[container.dataset.project].allocations[
      container.dataset.allocation
    ];

    if (
      this.menuData.allocation &&
      this.menuData.allocation.Id === allocation.Id
    ) {
      this.closeAllocationMenu();
    } else {
      this.menuData.open = true;

      let projectHeight = this.template
        .querySelector(".project-container")
        .getBoundingClientRect().height;
      let allocationHeight = this.template
        .querySelector(".lwc-allocation")
        .getBoundingClientRect().height;
      let totalSlots = this.times.length;
      let rightEdge =
        ((totalSlots - (allocation.right + 1)) / totalSlots) * 100 + "%";

      let topEdge =
        projectHeight * container.dataset.project + allocationHeight;

      this.menuData.allocation = Object.assign({}, allocation);
      this.menuData.style =
        "top: " + topEdge + "px; right: " + rightEdge + "; left: unset";
    }
  }

  handleModalEditClick(event) {
    //this.selectedAllocation= this.menuData.allocation; ////////????????????????to be edited
    this.selectedAllocation = {
      resourceName: this.resource.Name,
      projectName: this.menuData.allocation.projectName,
      Id: this.menuData.allocation.Id,
      startDate: this.menuData.allocation[this.startDateFieldApi],
      endDate: this.menuData.allocation[this.endDateFieldApi],
      status: this.menuData.allocation[this.junctionStatusFieldApiName],
      isFullEdit: this.menuData.allocation[this.junctionStatusFieldApiName] !== "Unavailable",
      disabled: false
    };
    //this.template.querySelector(".edit-allocation-modal").show();
    this.displayEditRecord=true;
    this.closeAllocationMenu();
  }
  handleCreateCancel(event){
    this.displayNewRecord=false;
  }
  handleCancel(event){
    this.displayEditRecord=false;
  }
  editAllocationModalSuccess() {
    const startDate = new Date(this.selectedAllocation.startDate + "T00:00:00");
    const endDate = new Date(this.selectedAllocation.endDate + "T00:00:00");
    let newAllocation={}
    newAllocation.Id=this.selectedAllocation.id;
    newAllocation.startDate=startDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000 + "";
    newAllocation.endDate=endDate.getTime() + startDate.getTimezoneOffset() * 60 * 1000 + "";
    newAllocation.projectId=this.selectedAllocation[this.projectFieldApiName];
    newAllocation.resourceId=this.selectedAllocation[this.allocatedItemFieldApiName];
    saveAllocation({
      junctionObjectApiName:this.junctionObjectApiName,
      inputFields:this.getInputFields(newAllocation)
    })
      .then(() => {
        this.selectedAllocation = {};
        //this.template.querySelector(".edit-allocation-modal").hide();
        this.displayEditRecord=false;
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

  handleMenuDeleteClick(event) {
    this.selectedAllocation= this.menuData.allocation;
    this.template.querySelector(".delete-modal").show();
    this.closeAllocationMenu();
  }
  handleModalCancel(event){
    switch (event.detail) {
      case "deleteAllocation":
        this.selectedAllocation=null;
        break;
      case "editAllocation":
        this.selectedAllocation=null;
        break;
      case "addAllocation":
        break;
      default:
        break;
    }
  }
  handleMenuDeleteSuccess() {
    deleteRecord(this.selectedAllocation.id)
    .then(() => {
      this.template.querySelector(".delete-modal").hide();
      this.dispatchEvent(
        new CustomEvent("refresh", {
          bubbles: true,
          composed: true
        })
      );
      this.selectedAllocation=null;
        
    })
    .catch(error => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error deleting record',
                message: error.body.message,
                variant: 'error'
            })
        );
    });
  }
  upsertJunctionRecord(newAllocation){
    //this.displayBar=false;
    let temp=this.getInputFields(newAllocation);
    saveAllocation({
      junctionObjectApiName:this.junctionObjectApiName,
      inputFields:temp

    }).then(() => {
      // send refresh to top
      this.dispatchEvent(new CustomEvent("refresh", {
          bubbles: true,
          composed: true
        })
      );
      //this.displayBar=true;
      this.addAllocationData=null;
      this.selectedAllocation=null;
    })
    .catch(error => { this.dispatchEvent(
        new ShowToastEvent({
          message: error.body.message,
          variant: "error"
        })
      );
       //this.displayBar=true;
    });
    
  }
  getInputFields(newAllocation){
    let retVal=[];
    retVal.push(this.getfieldObj(this.startDateFieldApi, newAllocation.startDate, 'Date'));
    retVal.push(this.getfieldObj(this.endDateFieldApi, newAllocation.endDate, 'Date'));
    retVal.push(this.getfieldObj('Id', newAllocation.id?newAllocation.id:newAllocation.Id, 'Id'));
    retVal.push(this.getfieldObj(this.projectFieldApiName, newAllocation.projectId, 'Id'));
    retVal.push(this.getfieldObj(this.allocatedItemFieldApiName, newAllocation.resourceId, 'Id'));
    return retVal;
  }
  getfieldObj(api, value, type){
    let retObj={};
    retObj.api=api;
    retObj.value=value;
    retObj.type=type;
    return retObj;
  }
}