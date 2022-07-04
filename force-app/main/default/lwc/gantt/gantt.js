/* eslint-disable guard-for-in */
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

import { createRecord, updateRecord, deleteRecord } from 'lightning/uiRecordApi';

// Static resources
import GanttFiles from '@salesforce/resourceUrl/dhtmlxgantt713';

// Controllers
import getTasks from '@salesforce/apex/GanttData.getTasks';
import createResource from '@salesforce/apex/GanttData.createResource';
import getResourcesByProject from '@salesforce/apex/GanttData.getResourcesByProject';
import getAllResourcesByProject from '@salesforce/apex/GanttData.getAllResourcesByProject';
import getAllProjectsByResource from '@salesforce/apex/GanttData.getAllProjectsByResource';
import getProjectsByResource from '@salesforce/apex/GanttData.getProjectsByResource';

function unwrap(fromSF){
    const data = fromSF.tasks.map(a => ({
        id: a.identifier,
        text: a.displayLabel,
        type: a.type,
        start_date: a.startDate,
        end_date: a.endDate,
        //duration: a.Number_of_Weekdays__c,
        parent: a.parentIdentifier,
        progress: a.progress,
    }));
    const links = fromSF.links.map(a => ({
        id: a.Id,
        source: a.Source__c,
        target: a.Target__c,
        type: a.Type__c
    }));
    return { data, links };
}

export default class GanttView extends LightningElement {
    static delegatesFocus = true;

    @api recordId;

    @api height;
    ganttInitialized = false;

    renderedCallback() {
        if (this.ganttInitialized) {
            return;
        }
        this.ganttInitialized = true;
        Promise.all([
            loadScript(this, GanttFiles + '/dhtmlxgantt.js'),
            loadStyle(this, GanttFiles + '/dhtmlxgantt.css'),
        ]).then(() => {
            this.initializeUI();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading Gantt',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    toggleGroups(cRecordId){
        var element = document.createElement("input");
        //Assign different attributes to the element. 
        element.id = 'toggleView';
        element.type = 'button';
        element.value = 'Show Projects By Resource';
        element.style = 'color:blue';
        element.onclick = function(){
            if(element.value == 'Show Resources By Project'){
                if(cRecordId != '' && cRecordId!=undefined){
                    getResourcesByProject({currentRecordId:cRecordId}).then(d => {
                        gantt.clearAll();
                        this.addTodayMarker();
                        gantt.parse(unwrap(d));
                    });
                    let elem = document.getElementById('toggleView');
                    elem.setAttribute('value','Show Projects By Resource');
                    elem.setAttribute('style','color:blue');
                }
                else{
                    getAllResourcesByProject().then(d => {
                        gantt.clearAll();
                        this.addTodayMarker();
                        gantt.parse(unwrap(d));
                    });
                    let elem = document.getElementById('toggleView');
                    elem.setAttribute('value','Show Projects By Resource');
                    elem.setAttribute('style','color:blue');
                }
            }
            else{
                if(cRecordId != '' && cRecordId!=undefined){
                    getProjectsByResource({currentRecordId:cRecordId}).then(d => {
                        gantt.clearAll();
                        this.addTodayMarker();
                        gantt.parse(unwrap(d));
                    });
                    let elemt = document.getElementById('toggleView');
                    elemt.setAttribute('value','Show Resources By Project');
                    elemt.setAttribute('style','color:green');
                }
                else{
                    getAllProjectsByResource().then(d => {
                        gantt.clearAll();
                        this.addTodayMarker();
                        gantt.parse(unwrap(d));
                    });
                    let elemt = document.getElementById('toggleView');
                    elemt.setAttribute('value','Show Resources By Project');
                    elemt.setAttribute('style','color:green');
                }
            }
        }

        var btn = this.template.querySelector('.ganttChart');
        btn.appendChild(element);
    }

    

    initializeGanttZoom(){
        const btnGanttZoomIn = document.createElement("input");
        //Assign different attributes to the element. 
        btnGanttZoomIn.id = 'btnGanttZoomIn';
        btnGanttZoomIn.type = 'button';
        btnGanttZoomIn.value = 'Zoom In';
        btnGanttZoomIn.style = 'color:black';

        const btnGanttZoomOut = document.createElement("input");
        //Assign different attributes to the element. 
        btnGanttZoomOut.id = 'btnGanttZoomOut';
        btnGanttZoomOut.type = 'button';
        btnGanttZoomOut.value = 'Zoom Out';
        btnGanttZoomOut.style = 'color:black';
        
        const zoomModule = gantt.ext.zoom;
            zoomModule.init({
            levels: [
            {
                name:"day",
                scale_height: 27,
                min_column_width:80,
                scales:[
                    {unit: "day", step: 1, format: "%d %M"}
                ]
            },
            {
                name:"week",
                scale_height: 50,
                min_column_width:50,
                scales:[
                    {unit: "week", step: 1, format: function (date) {
                        var dateToStr = gantt.date.date_to_str("%d %M");
                        var prevDate = gantt.date.add(date, -6, "day");
                        var weekNum = gantt.date.date_to_str("%W")(date);
                        return "#" + weekNum + ", " + dateToStr(prevDate) + " - " + dateToStr(date);
                        }
                    },
                    {unit: "day", step: 1, format: "%j %D"}
                ]
            },
            {
                name:"month",
                scale_height: 50,
                min_column_width:120,
                scales:[
                    {unit: "month", format: "%F, %Y"},
                    {unit: "week", format: "Week #%W"}
                ]
            },
            {
                name:"quarter",
                height: 50,
                min_column_width:90,
                scales:[
                    {unit: "month", step: 1, format: "%M"},
                    {unit: "quarter", step: 1, format: function (date) {
                        var dateToStr = gantt.date.date_to_str("%M");
                        var endDate = gantt.date.add(gantt.date.add(date, 3, "month"), -1, "day");
                        return dateToStr(date) + " - " + dateToStr(endDate);
                    }
                    }
                ]
            },
            {
                name:"year",
                scale_height: 50,
                min_column_width: 30,
                scales:[
                    {unit: "year", step: 1, format: "%Y"}
                ]
            }
            ]
        });
        zoomModule.setLevel("year");

        btnGanttZoomIn.onclick = function(){
            zoomModule.zoomIn();
        }
        btnGanttZoomOut.onclick = function(){
            zoomModule.zoomOut();
        }
        var ganttSection = this.template.querySelector('.ganttChart');
        ganttSection.appendChild(btnGanttZoomIn);
        ganttSection.appendChild(btnGanttZoomOut);
    }
    addTodayMarker(){
        gantt.addMarker({
            start_date: new Date(),
            css: "today",
            text: "Today",
            title:"Today"
        });
    }
    
    initializeUI(){
        const root = this.template.querySelector('.container');
        root.style.height = this.height + "px";

        //uncomment the following line if you use the Enterprise or Ultimate version
        //const gantt = window.Gantt.getGanttInstance();
        gantt.config.scales = [
            {unit: "month", step: 2, format: "%M"},
            {unit: "year", step: 1, format: "%Y"}
        ];

        gantt.config.columns =  [
            {name:"text",       label:"Resource",  tree:true , autoWidth: true},
            {name:"start_date", label:"Start Date", align:"center", autoWidth: true},
            {name:"end_date",   label:"End Date",   align:"center", autoWidth: true}
        ];
        gantt.config.open_tree_initially = true;
        // gantt.config.server_utc = false;

        gantt.templates.parse_date = date => new Date(date);
        let dateToStr = gantt.date.date_to_str("%Y-%m-%d",false);
        gantt.templates.format_date = function(date){
            return dateToStr (date);
        };
        // gantt.templates.format_date = date => date.toString();
        
        gantt.plugins({
            marker: true,
            fullscreen: true,
            critical_path: true,
            auto_scheduling: true,
            tooltip: true,
            undo: true
        });
        // var today = new Date();
        // gantt.addMarker({
        //     start_date: today,
        //     css: "today",
        //     text: "Today",
        //     title:"Today: "
        // });

        this.initializeGanttZoom();
        
        gantt.init(root);
        if(this.recordId){
            getResourcesByProject({currentRecordId:this.recordId}).then(d => {
                gantt.clearAll();
                this.addTodayMarker();
                gantt.parse(unwrap(d));
            })
        }
        else{
            getAllResourcesByProject({}).then(d => {
                gantt.clearAll();
                this.addTodayMarker();
                gantt.parse(unwrap(d));
            })
        }

        gantt.createDataProcessor({
            task: {
                create: function(data) {
                    /*
                    const insert = { apiName: "GanttTask__c", fields:{
                        Name : data.text,
                        Start_Date__c : data.start_date,
                        Duration__c : data.duration,
                        Parent__c : String(data.parent),
                        Progress__c : data.progress
                    }};

                    let resourceJSON = {
                        "Resource__c":'0036D00000SByEBQA1',
                        "Start_Date_of_Engagement__c":data.start_date
                    }
                    */
                    console.log(data.start_date);
                    let a = createResource({resourcedata : JSON.stringify(resourceJSON)});
                    return createRecord(insert).then(res => {
                        return { tid: 1, ...res };
                    });

                },
                update: function(data, id) {
                    console.log(data);
                    const update = { fields:{
                        Id: id,
                        //Name : data.text,
                        // Start_Date_of_Engagement__c : new Date(data.start_date?.getFullYear(),data.start_date?.getMonth(),data.start_date?.getDate()),
                        Start_Date_of_Engagement__c : data.start_date,
                        // End_Date_of_Engagement__c :new Date(data.end_date?.getFullYear(),data.end_date?.getMonth(),data.end_date?.getDate())
                        End_Date_of_Engagement__c : data.end_date
                        //Duration__c : data.duration,
                        //Parent__c : String(data.parent),
                        //Progress__c : data.progress
                    }};
                    return updateRecord(update).then((result) => {
                        console.log(result);
                    }).catch(error =>{
                        console.log(error);
                    });
                },
                delete: function(id) {
                    return deleteRecord(id).then(() => ({}));
                }
             },
             link: {
                // create: function(data) {
                //     const insert = { apiName: "GanttLink__c", fields:{
                //         Source__c : data.source,
                //         Target__c : data.target,
                //         Type__c : data.type,
                //     }};
                //     return createRecord(insert).then(res => {
                //         return { tid: res.id };
                //     });
                // },
                // update: function(data, id) {
                //     const update = { apiName: "GanttLink__c", fields:{
                //         Id : id,
                //         Source__c : data.source,
                //         Target__c : data.target,
                //         Type__c : data.type,
                //     }};
                //     return updateRecord(update).then(() => ({}));
                // },
                // delete: function(id) {
                //     return deleteRecord(id).then(() => ({}));
                // }
             }
        }).init(gantt);
        
        if(!this.recordId){
            this.toggleGroups(this.recordId);
        }
    }
    
}