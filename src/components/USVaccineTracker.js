import React, { useEffect, useState, Component, createRef} from 'react'
import { Container, Breadcrumb, Dropdown, Header, Grid, Progress, Loader, Divider, Popup, Table, Button, Image, Rail, Sticky, Ref, Segment, Accordion, Icon, Menu, Message, Transition} from 'semantic-ui-react'
import AppBar from './AppBar';
import { geoCentroid } from "d3-geo";
import Geographies from './Geographies';
import Geography from './Geography';
import ComposableMap from './ComposableMap';
import Marker from './Marker';
import Annotation from './Annotation';
import { Waypoint } from 'react-waypoint'
import ReactTooltip from "react-tooltip";
import { VictoryChart, 
  VictoryGroup, 
  VictoryBar, 
  VictoryTheme, 
  VictoryAxis, 
  // VictoryLegend,
  VictoryLine,  
  VictoryLabel, 
  VictoryArea,
  VictoryContainer
} from 'victory';
import { useParams, useHistory } from 'react-router-dom';
import Notes from './Notes';
import _ from 'lodash';
import { scaleQuantile } from "d3-scale";
import configs from "./state_config.json";
// import ReactDOM from 'react-dom';
// import fips2county from './fips2county.json'
// import stateOptions from "./stateOptions.json";

import { var_option_mapping, CHED_static, CHED_series} from "../stitch/mongodb";
import {HEProvider, useHE} from './HEProvider';
import {useStitchAuth} from "./StitchAuth";
import {LineChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, LabelList, ReferenceArea, ReferenceLine} from "recharts";

// function getKeyByValue(object, value) {
//   return Object.keys(object).find(key => object[key] === value);
// }

function getMax(arr, prop) {
    var max;
    for (var i=0 ; i<arr.length ; i++) {
        if (max == null || parseInt(arr[i][prop]) > parseInt(max[prop]))
            max = arr[i];
    }
    return max;
}

function getMaxRange(arr, prop, range) {
    var max;
    for (var i=range ; i<arr.length ; i++) {
        if (max == null || parseInt(arr[i][prop]) > parseInt(max[prop]))
            max = arr[i];
    }
    return max;
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

// const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3.0.0/states-10m.json"

const colorPalette = [
        "#e1dce2",
        "#d3b6cd",
        "#bf88b5", 
        "#af5194", 
        "#99528c", 
        "#633c70", 
      ];
const colorHighlight = '#f2a900';
const stateColor = "#778899";
const nationColor = '#b1b3b3';

const VaxColor = [
  "#72ABB1",
  "#337fb5"
];

function goToAnchor(anchor) {
  var loc = document.location.toString().split('#')[0];
  document.location = loc + '#' + anchor;
  return false;
}
const contextRef = createRef()
const nameList = ['Vaccination Tracker', 'Select Your State', 
'Vaccination FAQs', 'Subheader', 'Subheader'];
var scrollCount = 0;

function StickyExampleAdjacentContext(props) {
    const contextRef = createRef();
    const [sTate, setsTate] = useState({ activeItem: nameList[0] })
    const { activeItem } = sTate
    useEffect(() => {
        setsTate(nameList[scrollCount])
    }, [scrollCount])
    
    return (

        <div >
          <Ref innerRef={contextRef}>
            <Rail attached size='mini' >
                <Sticky offset={180} position= "fixed" context={contextRef}>
                    <Menu
                        size='small'
                        compact
                        pointing secondary vertical>
                        <Menu.Item as='a' href="#" name={nameList[0]} active={props.activeCharacter == nameList[0] || activeItem === nameList[0]}
                              onClick={(e, { name }) => { setsTate({ activeItem: name }) }}><Header as='h4'> {nameList[0]} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Header></Menu.Item>
                        <Menu.Item as='a' href="#select" name={nameList[1]} active={props.activeCharacter == nameList[1] || activeItem === nameList[1]}
                              onClick={(e, { name }) => { setsTate({ activeItem: name }) }}><Header as='h4'>{nameList[1]}</Header></Menu.Item>
                        <Menu.Item as='a' href="#faq" name={nameList[2]} active={props.activeCharacter == nameList[2] || activeItem === nameList[2]}
                              onClick={(e, { name }) => { setsTate({ activeItem: name }) }}><Header as='h4'>{nameList[2]}</Header></Menu.Item>
                        <Menu.Item as='a' href="#commu" name={nameList[3]} active={props.activeCharacter == nameList[3] || activeItem === nameList[3]}
                              onClick={(e, { name }) => { setsTate({ activeItem: name }) }}><Header as='h4'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; by {nameList[3]}</Header></Menu.Item>
                        <Menu.Item as='a' href="#commu" name={nameList[4]} active={props.activeCharacter == nameList[4] || activeItem === nameList[4]}
                              onClick={(e, { name }) => { setsTate({ activeItem: name }) }}><Header as='h4'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; by {nameList[4]}</Header></Menu.Item>
                    </Menu>
                </Sticky>
            </Rail>
          </Ref> 
        </div>
    )
  // }

}



function CaseChart(props){
  const [playCount, setPlayCount] = useState(0);
  const data = props.data;
  const sfps = props.stateFips;
  const ticks = props.ticks;
  const variable = props.var;
  const tickFormatter = props.tickFormatter;
  const labelFormatter = props.labelFormatter;
  const [animationBool, setAnimationBool] = useState(true);

  const caseYTickFmt = (y) => {
    return y<1000?y:(y/1000+'k');
  };

  useEffect(() =>{
    setAnimationBool(true);
  },[playCount])

  return(
    <div style={{paddingTop: 5, paddingBottom: 70, width: 780}}>
      <LineChart width={720} height={180} data = {data} margin={{right: 20}}>
        {/* <CartesianGrid stroke='#f5f5f5'/> */}
        <XAxis dataKey="t" ticks={ticks} tick={{fontSize: 16}} tickFormatter={tickFormatter} allowDuplicatedCategory={false}/>
        <YAxis tickFormatter={caseYTickFmt} tick={{fontSize: 16}}/>
        <Line data={data["_nation"]} name="Nation" type='monotone' dataKey={variable} dot={false} 
              isAnimationActive={animationBool} 
              onAnimationEnd={()=>setAnimationBool(false)} 
              animationDuration={5500} 
              animationBegin={500} 
              stroke={nationColor} strokeWidth="2" />
        <Line data={data[sfps]} name="State" type='monotone' dataKey={variable} dot={false} 
              isAnimationActive={animationBool} 
              onAnimationEnd={()=>setAnimationBool(false)}
              animationDuration={5500} 
              animationBegin={500} 
              stroke={stateColor} strokeWidth="2" />
        
        {/* <ReferenceLine x={data["_nation"][275].t} stroke="red" label="2021" /> */}


        
        <Tooltip labelFormatter={labelFormatter} formatter={variable === "covidmortality7dayfig" ? (value) => numberWithCommas(value.toFixed(1)): (value) => numberWithCommas(value.toFixed(0))} active={true}/>
      </LineChart>
      {/* <LineChart width={500} height={300}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="t" type="category" allowDuplicatedCategory={false} />
        <YAxis dataKey={variable} />
        <Tooltip />
        <Legend />
        
        <Line dataKey={variable} data={data["_nation"]} name = "nation" />
        <Line dataKey={variable} data={data[sfps]} name = "nation1"/>
        <Line dataKey={variable} data={data[sfps+cfps]} name = "nation2"/>
      </LineChart> */}
      <Button content='Play' icon='play' floated="right" onClick={() => {setPlayCount(playCount+1); }}/>
    </div>
  );
}

export default function USMap(props) {
  const {
    isLoggedIn,
    actions: { handleAnonymousLogin },
  } = useStitchAuth();
  const [caseTicks, setCaseTicks] = useState([]);
  const caseTickFmt = (tick) => { 
    return (
      // <text>// </ text>
        /* {tick} */
        // monthNames[new Date(tick*1000).getMonth()] + " " +  new Date(tick*1000).getDate()
        (new Date(tick*1000).getMonth()+1) + "/" +  new Date(tick*1000).getDate()
      
      );
  };
  // const [open, setOpen] = React.useState(true)
  const [showState, setShowState] = useState(false);
  const [clicked, setClicked] = useState(false);

  const [activeCharacter, setActiveCharacter] = useState('');

  const history = useHistory();
  const [tooltipContent, setTooltipContent] = useState('');
  
  const [stateLabels, setStateLabels] = useState();
  const [date, setDate] = useState('');

  const [data, setData] = useState();
  const [dataTS, setDataTS] = useState();
  const [VaxSeries, setVaxSeries] = useState();
  const [vaccineData, setVaccineData] = useState();
  const [allTS, setAllTS] = useState();
  const [raceData, setRaceData] = useState();
  const [dataFltrd, setDataFltrd] = useState();
  const [nationalDemog, setNationalDemog] = useState();

  // const [dataState, setDataState] = useState();

  const [stateName, setStateName] = useState('The United States');
  const [stateMapName, setStateMapName] = useState('State');
  const [fips, setFips] = useState('_nation');
  const [stateFips, setStateFips] = useState();
  const [stateMapFips, setStateMapFips] = useState("_nation");
  const [config, setConfig] = useState();
  const [countyFips, setCountyFips] = useState('');

  const [colorScale, setColorScale] = useState();
  const [legendMax, setLegendMax] = useState([]);
  const [legendMin, setLegendMin] = useState([]);
  const [legendSplit, setLegendSplit] = useState([]);

  const [colorScaleState, setColorScaleState] = useState();
  const [legendMaxState, setLegendMaxState] = useState([]);
  const [legendMinState, setLegendMinState] = useState([]);
  const [legendSplitState, setLegendSplitState] = useState([]);

  const [varMap, setVarMap] = useState({});
  const [metric, setMetric] = useState('caserate7dayfig');
  const [metricOptions, setMetricOptions] = useState('caserate7dayfig');
  const [metricName, setMetricName] = useState('Average Daily COVID-19 Cases per 100,000');

  const [accstate, setAccstate] = useState({ activeIndex: 1 });

  const dealClick = (e, titleProps) => {
  const { index } = titleProps
  const { activeIndex } = accstate
  const newIndex = activeIndex === index ? -1 : index

  const trendOptions = [
    {
      key: 'caserate7dayfig',
      text: 'Average Daily COVID-19 Cases /100,000',
      value: 'caserate7dayfig',
    },
    {
      key: 'covidmortality7dayfig',
      text: 'Average Daily COVID-19 Deaths /100,000',
      value: 'covidmortality7dayfig',
    },
  ]
  const trendName = 
    {
      'caserate7dayfig': 'Average Daily COVID-19 Cases /100,000',
      'covidmortality7dayfig': 'Average Daily COVID-19 Deaths /100,000'

    }
    


  setAccstate({ activeIndex: newIndex })
  }
  const [delayHandler, setDelayHandler] = useState();

  const labelTickFmt = (tick) => { 
    return (
      // <text>// </ text>
        /* {tick} */
        // monthNames[new Date(tick*1000).getMonth()] + " " +  new Date(tick*1000).getDate()
        new Date(tick*1000).getFullYear() + "/" + (new Date(tick*1000).getMonth()+1) + "/" +  new Date(tick*1000).getDate()
      
      );
  };

  useEffect(()=>{
    fetch('/data/date.json').then(res => res.json())
      .then(x => setDate(x.date.substring(5,7) + "/" + x.date.substring(8,10) + "/" + x.date.substring(0,4)));
    
    fetch('/data/allstates.json').then(res => res.json())
      .then(x => setStateLabels(x));

    fetch('/data/rawdata/variable_mapping.json').then(res => res.json())
      .then(x => {
        setVarMap(x);
        setMetricOptions(_.filter(_.map(x, d=> {
          return {key: d.id, value: d.variable, text: d.name, def: d.definition, group: d.group};
        }), d => (d.text !== "Urban-Rural Status" && d.group === "outcomes")));
      });
    fetch('/data/nationalDemogdata.json').then(res => res.json())
      .then(x => setNationalDemog(x));
  }, []);

  useEffect(()=>{
    fetch('/data/timeseriesAll.json').then(res => res.json())
      .then(x => setAllTS(x));
  }, []);

  useEffect(()=>{
    fetch('/data/racedataAll.json').then(res => res.json())
      .then(x => setRaceData(x));
    fetch('/data/vaccineData.json').then(res => res.json())
      .then(x => {setVaccineData(x);});
    

    
  }, []);

  useEffect(() => {
    if (metric) {
      fetch('/data/VaccineTimeseries.json').then(res => res.json())
      .then(x => {setVaxSeries(x);});
      
      fetch('/data/data.json').then(res => res.json())
        .then(x => {
          
          setData(x);
          setDataFltrd(_.filter(_.map(x, (d, k) => {
            d.fips = k
            return d}), 
            d => (d.Population > 10000 && 
                d.black > 5 && 
                d.fips.length === 5 && 
                d['covidmortalityfig'] > 0)));
        
          const cs = scaleQuantile()
          .domain(_.map(_.filter(_.map(x, (d, k) => {
            d.fips = k
            return d}), 
            d => (
                d[metric] >= 0 &&
                d.fips.length === 5)),
            d=> d[metric]))
          .range(colorPalette);

          let scaleMap = {}
          _.each(x, d=>{
            if(d[metric] >= 0){
            scaleMap[d[metric]] = cs(d[metric])}});
        
          setColorScale(scaleMap);
          var max = 0
          var min = 100
          _.each(x, d=> { 
            if (d[metric] > max && d.fips.length === 5) {
              max = d[metric]
            } else if (d.fips.length === 5 && d[metric] < min && d[metric] >= 0){
              min = d[metric]
            }
          });

          if (max > 999999) {
            max = (max/1000000).toFixed(0) + "M";
            setLegendMax(max);
          }else if (max > 999) {
            max = (max/1000).toFixed(0) + "K";
            setLegendMax(max);
          }else{
            setLegendMax(max.toFixed(0));

          }
          setLegendMin(min.toFixed(0));
          setLegendSplit(cs.quantiles());

        });
    }
  }, []);



  useEffect(()=>{
    if (metric) {

    
    const configMatched = configs.find(s => s.fips === stateMapFips);

    if (!configMatched){
      
    }else{

      setConfig(configMatched);

      setStateMapName(configMatched.name);

      fetch('/data/data.json').then(res => res.json())
        .then(x => {
          

          const cs = scaleQuantile()
          .domain(_.map(_.filter(_.map(x, (d, k) => {
            d.fips = k
            return d}), 
            d => (
                d[metric] > 0 &&
                d.fips.length === 5)),
            d=> d[metric]))
          .range(colorPalette);

          let scaleMap = {}
          _.each(_.filter(_.map(x, (d, k) => {
            d.fips = k
            return d}), 
            d => (
                d[metric] > 0 &&
                d.fips.length === 5))
                , d=>{
            scaleMap[d[metric]] = cs(d[metric])});

          setColorScaleState(scaleMap);
          var max = 0
          var min = 100
          _.each(x, d=> { 
            if (d[metric] > max && d.fips.length === 5) {
              max = d[metric]
            } else if (d.fips.length === 5 && d[metric] < min && d[metric] > 0){
              min = d[metric]
            }
          });

          if (max > 999) {
            max = (max/1000).toFixed(0) + "K";
            setLegendMaxState(max);
          }else{
            setLegendMaxState(max.toFixed(0));

          }
          setLegendMinState(min.toFixed(0));

          var split = scaleQuantile()
          .domain(_.map(_.filter(_.map(x, (d, k) => {
            d.fips = k
            return d}), 
            d => (
                d[metric] > 0 &&
                d.fips.length === 5)),
            d=> d[metric]))
          .range(colorPalette);

          setLegendSplitState(split.quantiles());
        });
      }
    }
     
  }, [stateMapFips]);

  useEffect(()=>{
    if (metric) {
      const configMatched = configs.find(s => s.fips === stateFips);
      if (!configMatched){
      }else{
        if (isLoggedIn === true){
          setConfig(configMatched);
          setStateName(configMatched.name);
          const fetchData = async() => { 
            let seriesDict = {};
            if( stateFips !== "_nation"){
              //Timeseries data
              const seriesQ = { $or: [ { state: "_n" } , { state: stateFips } ] }
              const prom = await CHED_series.find(seriesQ, {projection: {}}).toArray();
              _.map(prom, i=> {
                seriesDict[i[Object.keys(i)[4]]] = i[Object.keys(i)[5]];
                return seriesDict;
              });
            }
            setDataTS(seriesDict);
          };
          fetchData();
        } else {
          handleAnonymousLogin();
        }
      }
    }
  },[isLoggedIn]);



  if (data && dataFltrd && stateLabels && allTS && vaccineData ) {
    console.log(VaxSeries);
  return (
      <div>
        <AppBar menu='countyReport'/>
        <Container style={{marginTop: '8em', minWidth: '1260px'}}>
          {/* <Breadcrumb style={{fontSize: "14pt", paddingTop: "14pt"}}>
            <Breadcrumb.Section active >Vaccination: United States</Breadcrumb.Section>
            <Breadcrumb.Divider style={{fontSize: "14pt"}}/>
          </Breadcrumb>
          <Divider hidden /> */}
          <Grid >
            
            <Grid.Column width={2} style={{zIndex: 10}}>
              <Ref innerRef={createRef()} >
                <StickyExampleAdjacentContext activeCharacter={activeCharacter}  />
              </Ref>
            </Grid.Column>
            <Grid.Column style = {{paddingLeft: 150, width: 1000}}>
              <center>  
                <Waypoint onEnter={() => {
                  setActiveCharacter('Vaccination Tracker')}}>
                </Waypoint> 
              </center>
              {/* <Grid columns={14}> */}
              <div>     	
                <Header as='h2' style={{color: VaxColor[1],textAlign:'center', fontWeight: 400, fontSize: "24pt", paddingTop: 17, paddingLeft: "5em", paddingBottom: 50}}>
                  <Header.Content >
                  <b> Vaccination Tracker </b> 
                  
                  </Header.Content>
                </Header>
              </div>
              <Divider horizontal style={{fontWeight: 400, width: 1000, color: 'black', fontSize: '22pt', paddingLeft: 20}}> COVID-19 Vaccination in the United States </Divider>

              <Grid>


              <Grid.Row columns = {5} style = {{width: 1000, paddingLeft: 35, paddingTop: 20}}>
                <Grid.Column style = {{width: 240, paddingLeft: 0, paddingTop: 8}}> 
                  <div style = {{width: 240}}>
                    <Header>
                      <p style={{fontSize: "24px", fontFamily: 'lato', color: "#004071"}}> Doses Distributed <br/><br/></p>
                      <Header.Content style = {{paddingBottom: 5}}>
                        
                        <p style={{fontSize: "28px", fontFamily: 'lato', color: "#004071"}}>{numberWithCommas(vaccineData["_nation"]["Doses_Distributed"])}</p>
                      </Header.Content>
                    </Header>
                  </div>
                </Grid.Column>
                <Grid.Column style = {{width: 240, paddingLeft: 80, paddingTop: 8}}> 
                  <div style = {{width: 240}}>
                    <Header>
                      <p style={{fontSize: "24px", fontFamily: 'lato', color: "#004071"}}> Dose 1 Administered <br/><br/></p>
                      <Header.Content style = {{paddingBottom: 5}}>
                        
                        <p style={{fontSize: "28px", fontFamily: 'lato', color: "#004071"}}>{numberWithCommas(vaccineData["_nation"]["Administered_Dose1"])}</p>
                      </Header.Content>
                    </Header>
                  </div>
                </Grid.Column>
                <Grid.Column style = {{width: 240, paddingLeft: 160, paddingTop: 8}}> 
                  <div style = {{width: 240}}>
                    <Header>
                      <p style={{fontSize: "24px", fontFamily: 'lato', color: "#004071"}}> Dose 1 Administered Per 100,000</p>
                      <Header.Content style = {{paddingBottom: 5}}>
                       
                        <p style={{fontSize: "28px", fontFamily: 'lato', color: "#004071"}}>{numberWithCommas(vaccineData["_nation"]["Administered_Dose1_Per_100K"])}</p>
                      </Header.Content>
                    </Header>
                  </div>
                </Grid.Column>
                <Grid.Column style = {{width: 240, paddingLeft: 240, paddingTop: 8}}> 
                  <div style = {{width: 240}}>
                    <Header>
                      <p style={{fontSize: "24px", fontFamily: 'lato', color: "#004071"}}> Dose 2 Administered</p>
                      <br/>
                      <Header.Content style = {{paddingBottom: 5}}>
                        
                        <p style={{fontSize: "28px", fontFamily: 'lato', color: "#004071"}}>{numberWithCommas(vaccineData["_nation"]["Administered_Dose2"])}</p>
                      </Header.Content>
                    </Header>
                  </div>
                </Grid.Column>
                
              </Grid.Row>
              
              <Grid.Row>
               <Grid.Column style = {{width: 900, paddingLeft: 35, paddingTop: 8}}> 
                  <div style = {{width: 900}}>
                    <Header>
                      <p style={{fontSize: "24px", fontFamily: 'lato', color: "#004071"}}> Percent Vaccinated</p>
                      <Header.Content style = {{paddingBottom: 5}}>
                        <Progress style = {{width: 900}} percent={stateFips === "_nation"? 0 : ((vaccineData["_nation"]["percentVaccinated"]).toFixed(0))} size='large' color='green' progress/>
                      </Header.Content>
                      <p style={{fontSize: "24px", fontFamily: 'lato', color: "#004071"}}>Number Vaccinated</p>
                      <p style={{fontSize: "28px", fontFamily: 'lato', color: "#004071"}}>{numberWithCommas(vaccineData["_nation"]["Administered_Dose2"])}</p>
                    </Header>
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row>
              {stateFips && <Accordion style = {{paddingTop: 0, paddingLeft: 30}}defaultActiveIndex={1} panels={[
                        {
                            key: 'acquire-dog',
                            title: {
                                content: <u style={{ fontFamily: 'lato', fontSize: "19px", color: "#397AB9"}}>About the data</u>,
                                icon: 'dropdown',
                            },
                            content: {
                                content: (
                                  <Header.Content style={{fontWeight: 300, paddingTop: 7, paddingLeft: 0,fontSize: "19px", width: 965}}>
                                    <b><em> Total Vaccine Doses Allocated </em></b> is the number of vaccine doses 
                                    that each state will receive from the Federal Government. <br/>

                                    <b><em> First Doses Administered </em></b> is the number of individuals who have 
                                    received the first dose of a COVID-19 vaccine. Individuals must receive two doses 
                                    of the current COVID-19 vaccines (Pfizer, Moderna) to become fully vaccinated. <br/>
                                    

                                    <b><em> Total Number of People Vaccinated </em></b> is the number of individuals 
                                    who have received two doses of the COVID-19 vaccine and have completed the vaccination series. <br/>

                                    <b><em> Percentage Vaccinated </em></b> is the percentage of the total population 
                                    who have received both doses of a COVID-19 vaccine.<br/>

                                    <b><em> *14-day change </em></b> trends use 7-day averages.<br/>

                                    Dashboard includes the percent of the population by age, sex, race, and ethnicity 
                                    for states that have made this data publicly available. 

                                  </Header.Content>
                                ),
                              },
                          }
                      ]
                      } /> }
              </Grid.Row>
              <Grid>
                <Grid.Column>
                  <Divider horizontal style={{fontWeight: 400, width: 1000, color: 'black', fontSize: '22pt', paddingLeft: 20}}> COVID-19 Vaccination by State </Divider>

                </Grid.Column>
              </Grid>

              <Grid>

                <Grid.Row columns = {2} style = {{width: 1000}}>

                  <Grid.Column style = {{width: 800, paddingLeft: 20}}>
                  
                    
                    <Grid.Row columns={2} style={{width: 800, paddingLeft: 0, paddingRight: 0, paddingBottom: 0}}>

                          
                      <div style = {{paddingBottom: 40}}>

                        <svg width="460" height="80" >
                          
                          {_.map(legendSplit, (splitpoint, i) => {
                            if(legendSplit[i] < 1){
                              return <text key = {i} x={40 + 20 * (i)} y={35} style={{fontSize: '0.7em'}}> {legendSplit[i].toFixed(1)}</text>                    
                            }else if(legendSplit[i] > 999999){
                              return <text key = {i} x={40 + 20 * (i)} y={35} style={{fontSize: '0.7em'}}> {(legendSplit[i]/1000000).toFixed(0) + "M"}</text>                    
                            }else if(legendSplit[i] > 999){
                              return <text key = {i} x={40 + 20 * (i)} y={35} style={{fontSize: '0.7em'}}> {(legendSplit[i]/1000).toFixed(0) + "K"}</text>                    
                            }
                            return <text key = {i} x={40 + 20 * (i)} y={35} style={{fontSize: '0.7em'}}> {legendSplit[i].toFixed(0)}</text>                    
                          })} 
                          <text x={20} y={35} style={{fontSize: '0.7em'}}>{legendMin}</text>
                          <text x={140} y={35} style={{fontSize: '0.7em'}}>{legendMax}</text>


                          {_.map(colorPalette, (color, i) => {
                            return <rect key={i} x={20+20*i} y={40} width="20" height="20" style={{fill: color, strokeWidth:1, stroke: color}}/>                    
                          })} 


                          <text x={20} y={74} style={{fontSize: '0.8em'}}>Low</text>
                          <text x={20+20 * (colorPalette.length - 1)} y={74} style={{fontSize: '0.8em'}}>High</text>


                          <rect x={165} y={40} width="20" height="20" style={{fill: "#FFFFFF", strokeWidth:0.5, stroke: "#000000"}}/>                    
                          <text x={187} y={50} style={{fontSize: '0.7em'}}> None </text>
                          <text x={187} y={59} style={{fontSize: '0.7em'}}> Reported </text>

                          <text x={280} y={59} style={{fontSize: '1.5em'}}> Click on a state</text>


                        </svg>
                      </div>
                    <ComposableMap 
                      projection="geoAlbersUsa" 
                      data-tip=""
                      width={700} 
                      height={350}
                      strokeWidth= {0.1}
                      stroke= 'black'
                      offsetX = {-250}
                      projectionConfig={{scale: 570}}


                      >
                      <Geographies geography={geoUrl}>
                        {({ geographies }) => 
                          <svg>
                            {setStateFips(fips)}
                            {geographies.map(geo => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                onMouseEnter={()=>{

                                  const stateFip = geo.id.substring(0,2);
                                  const configMatched = configs.find(s => s.fips === stateFip);

                                  // if(clicked === true){
                                  //   setDelayHandler(setTimeout(() => {
                                  //     setFips(stateFip);
                                        
                                  //     }, 3000))
                                    
                                  // }else{
                                    setFips(stateFip);
                                  // }
                                  
                                  // setStateFips(geo.id.substring(0,2));
                                  setStateName(configMatched.name); 
                                  
                                  // setShowState(false);
                                
                                }}
                                
                                onMouseLeave={()=>{

                                  setTooltipContent("");
                                  
                                  
                                  // if(clicked !== true){
                                  //   setFips("_nation");
                                  // }
                                  // setDelayHandler(setTimeout(() => {
                                  //   setClicked(false);
                                    
                                  // }, 5000))
                                  // clearTimeout(delayHandler);
                                }}

                                onClick={()=>{
                                  // history.push("/Vaccine-Tracker/"+geo.id.substring(0,2)+"");
                                setStateMapFips(geo.id.substring(0,2));
                                setClicked(true);
                                setShowState(true);
                                // history.push('/Vaccine-Tracker#select');
                                // goToAnchor('select')
                                }}

                                
                                fill={fips===geo.id.substring(0,2)?colorHighlight:
                                ((colorScale && data[geo.id] && (data[geo.id][metric]) > 0)?
                                    colorScale[data[geo.id][metric]]: 
                                    (colorScale && data[geo.id] && data[geo.id][metric] === 0)?
                                      '#e1dce2':'#FFFFFF')}
                                
                              />
                            ))}
                          </svg>
                        }
                      </Geographies>
                      

                    </ComposableMap>
                    </Grid.Row>
                    

                    {stateFips && <Accordion style = {{paddingTop: 80, paddingLeft: 12}}defaultActiveIndex={1} panels={[
                    {
                        key: 'acquire-dog',
                        title: {
                            content: <u style={{ fontFamily: 'lato', fontSize: "19px", color: "#397AB9"}}>About the data</u>,
                            icon: 'dropdown',
                        },
                        content: {
                            content: (
                              <Grid.Row style={{width: 400}}>
                                  <Header.Content style={{fontWeight: 300, paddingTop: 7, fontSize: "14pt", lineHeight: "18pt"}}>
                                  <b><em> {varMap["caserate7dayfig"].name} </em></b> {varMap["caserate7dayfig"].definition} <br/>
                                        <br/>
                                  For a complete table of definitions, click <a style ={{color: "#397AB9"}} href="https://covid19.emory.edu/data-sources" target="_blank" rel="noopener noreferrer"> here. </a>
                                  </Header.Content>
                              </Grid.Row>
                            ),
                          },
                      }
                  ]

                  } /> }
                  </Grid.Column>

                  <Grid.Column style ={{width: 500, paddingLeft: 50}}>
                    <Header as='h2' style={{fontWeight: 400}}>
                      <Header.Content style={{width : 500, fontSize: "18pt", textAlign: "center", paddingTop: 38}}>
                        Vaccination Status in <b>{stateName}</b>
                        
                      </Header.Content>
                    </Header>
                    <Grid>
                      <Grid.Row style={{paddingLeft:0}}>
                        <Table celled fixed >
                          <Table.Header>

                            <tr textalign = "center" colSpan = "5" style = {{backgroundImage : 'url(/Emory_COVID_header_LightBlue.jpg)'}}>
                                <td colSpan='1' style={{width:190}}> </td>
                                <td colSpan='1' style={{width:170, fontSize: '14px', textAlign : "center", font: "lato", fontWeight: 600, color: "#FFFFFF"}}> The United States</td>
                                <td colSpan='1' style={{width:170, fontSize: '14px', textAlign : "center", font: "lato", fontWeight: 600, color: "#FFFFFF"}}> {stateName}</td>
                            </tr>
                            <Table.Row textAlign = 'center' style = {{height: 40}}>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {"Dose 1 Administered"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData["_nation"]["Administered_Dose1"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData[fips]["Administered_Dose1"])} </Table.HeaderCell>

                            </Table.Row>
                            <Table.Row textAlign = 'center'>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {"Dose 1 Administered per 100K"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData["_nation"]["Administered_Dose1_Per_100K"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData[fips]["Administered_Dose1_Per_100K"])} </Table.HeaderCell>

                            </Table.Row>
                            <Table.Row textAlign = 'center'>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {"Dose 2 Administered"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData["_nation"]["Administered_Dose2"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData[fips]["Administered_Dose2"])} </Table.HeaderCell>

                            </Table.Row>
                            <Table.Row textAlign = 'center'>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {"Dose 2 Administered per 100K"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData["_nation"]["Administered_Dose2_Per_100K"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData[fips]["Administered_Dose2_Per_100K"])} </Table.HeaderCell>

                            </Table.Row>
                            {/* <Table.Row textAlign = 'center'>
                              <Table.HeaderCell style={{fontSize: '19px'}}> {"Moderna Vaccine"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '19px'}}> {numberWithCommas(vaccineData["_nation"]["Administered_Moderna"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '19px'}}> {numberWithCommas(vaccineData[fips]["Administered_Moderna"])} </Table.HeaderCell>

                            </Table.Row>
                            <Table.Row textAlign = 'center'>
                              <Table.HeaderCell style={{fontSize: '19px'}}> {"Pfizer \n \n Vaccine"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '19px'}}> {numberWithCommas(vaccineData["_nation"]["Administered_Pfizer"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '19px'}}> {numberWithCommas(vaccineData[fips]["Administered_Pfizer"])} </Table.HeaderCell>

                            </Table.Row> */}
                            <Table.Row textAlign = 'center'>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {"Percent Vaccinated"} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData["_nation"]["percentVaccinated"])} </Table.HeaderCell>
                              <Table.HeaderCell style={{fontSize: '24px'}}> {numberWithCommas(vaccineData[fips]["percentVaccinated"])} </Table.HeaderCell>

                            </Table.Row>
                            
                          </Table.Header>
                        </Table>
                      </Grid.Row>
                    </Grid>
                  </Grid.Column>
                </Grid.Row> 

              </Grid>
              <Grid>
                <Grid.Column>
                <Divider horizontal style={{fontWeight: 400, width: 1000, color: 'black', fontSize: '22pt', paddingLeft: 20, paddingBottom: 50}}> COVID-19 Burden in {stateName} </Divider>

                </Grid.Column>
              </Grid>

              <Grid.Row columns = {2} style = {{width: 1000}}>

                
                <Grid.Column style = {{width: 600}}>
                  <Grid>
                    

                  <Grid.Row columns = {2} style = {{width: 600, paddingLeft: 20}}>
                    <Grid.Column style = {{width: 240, paddingLeft: 15}}> 

                      <div>
                      {stateFips &&
                        <VictoryChart 
                                    minDomain={{ x: stateFips? allTS[stateFips][allTS[stateFips].length-15].t : allTS["13"][allTS["13"].length-15].t}}
                                    maxDomain = {{y: stateFips? getMaxRange(allTS[stateFips], "caseRateMean", (allTS[stateFips].length-15)).caseRateMean*1.05 : getMaxRange(allTS["13"], "caseRateMean", (allTS["13"].length-15)).caseRateMean*1.05}}                            
                                    width={220}
                                    height={180}
                                    padding={{marginLeft: 0, right: -1, top: 150, bottom: -0.9}}
                                    containerComponent={<VictoryContainer responsive={false}/>}>
                                    
                                    <VictoryAxis
                                      tickValues={stateFips ? 
                                        [
                                        allTS[stateFips][allTS[stateFips].length - Math.round(allTS[stateFips].length/3)*2 - 1].t,
                                        allTS[stateFips][allTS[stateFips].length - Math.round(allTS[stateFips].length/3) - 1].t,
                                        allTS[stateFips][allTS[stateFips].length-1].t]
                                        :
                                      [
                                        allTS["13"][allTS["13"].length - Math.round(allTS["13"].length/3)*2 - 1].t,
                                        allTS["13"][allTS["13"].length - Math.round(allTS["13"].length/3) - 1].t,
                                        allTS["13"][allTS["13"].length-1].t]}                         
                                      style={{grid:{background: "#ccdee8"}, tickLabels: {fontSize: 10}}} 
                                      tickFormat={(t)=> new Date(t*1000).toLocaleDateString()}/>
                                    
                                    <VictoryGroup 
                                      colorScale={[stateColor]}
                                    >

                                    <VictoryLine data={stateFips && allTS[stateFips] ? allTS[stateFips] : allTS["13"]}
                                        x='t' y='caseRateMean'
                                        />

                                    </VictoryGroup>
                                    <VictoryArea
                                      style={{ data: {fill: "#00BFFF" , fillOpacity: 0.1} }}
                                      data={stateFips && allTS[stateFips]? allTS[stateFips] : allTS["13"]}
                                      x= 't' y = 'caseRateMean'

                                    />

                                    <VictoryLabel text= {stateFips ? numberWithCommas((allTS[stateFips][allTS[stateFips].length - 1].dailyCases).toFixed(0)) : numberWithCommas((allTS["13"][allTS["13"].length - 1].dailyCases).toFixed(0))} x={80} y={80} textAnchor="middle" style={{fontSize: 40, fontFamily: 'lato', fill: "#004071"}}/>
                                    
                                    <VictoryLabel text= {stateFips ? 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) > 0? (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) + "%": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) < 0? ((allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0)).substring(1) + "%": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) + "%"
                                                        : 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) > 0? (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) + "%": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) < 0? ((allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0)).substring(1) + "%": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) + "%"} x={197} y={80} textAnchor="middle" style={{fontSize: 24, fontFamily: 'lato', fill: "#004071"}}/>
                                    
                                    <VictoryLabel text= {stateFips ? 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) > 0? "↑": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) < 0? "↓": ""
                                                        : 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) > 0? "↑": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) < 0? "↓": ""} 
                                                        

                                                        x={160} y={80} textAnchor="middle" style={{fontSize: 24, fontFamily: 'lato'

                                                        , fill: stateFips ? 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) > 0? "#FF0000": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyCases).toFixed(0) < 0? "#32CD32": ""
                                                        : 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) > 0? "#FF0000": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyCases).toFixed(0) < 0? "#32CD32": ""

                                                      }}/>

                                    <VictoryLabel text= {"14-day"}  x={197} y={100} textAnchor="middle" style={{fontSize: 12, fontFamily: 'lato', fill: "#004071"}}/>
                                    <VictoryLabel text= {"change"}  x={197} y={110} textAnchor="middle" style={{fontSize: 12, fontFamily: 'lato', fill: "#004071"}}/>
                                    <VictoryLabel text= {"Daily Cases"}  x={110} y={20} textAnchor="middle" style={{fontSize: "19px", fontFamily: 'lato', fill: "#004071"}}/>

                                    
                        </VictoryChart>}
                      </div>
                    </Grid.Column>
                    <Grid.Column style = {{width: 240, paddingLeft: 55}}> 
                      <div>
                      {stateFips && 
                        <VictoryChart theme={VictoryTheme.material}
                                    minDomain={{ x: stateFips? allTS[stateFips][allTS[stateFips].length-15].t: allTS["13"][allTS["13"].length-15].t}}
                                    maxDomain = {{y: stateFips? getMax(allTS[stateFips], "mortalityMean").mortalityMean + 0.8: getMax(allTS["13"], "mortalityMean").mortalityMean + 0.8}}                            
                                    width={220}
                                    height={180}       
                                    padding={{left: 0, right: -1, top: 150, bottom: -0.9}}
                                    containerComponent={<VictoryContainer responsive={false}/>}>
                                    
                                    <VictoryAxis
                                      tickValues={stateFips ? 
                                        [
                                        allTS[stateFips][allTS[stateFips].length - Math.round(allTS[stateFips].length/3)*2 - 1].t,
                                        allTS[stateFips][allTS[stateFips].length - Math.round(allTS[stateFips].length/3) - 1].t,
                                        allTS[stateFips][allTS[stateFips].length-1].t]
                                        :
                                      [
                                        allTS["13"][allTS["13"].length - Math.round(allTS["13"].length/3)*2 - 1].t,
                                        allTS["13"][allTS["13"].length - Math.round(allTS["13"].length/3) - 1].t,
                                        allTS["13"][allTS["13"].length-1].t]}                        
                                      style={{tickLabels: {fontSize: 10}}} 
                                      tickFormat={(t)=> new Date(t*1000).toLocaleDateString()}/>
                                    
                                    <VictoryGroup 
                                      colorScale={[stateColor]}
                                    >

                                      <VictoryLine data={stateFips && allTS[stateFips] ? allTS[stateFips] : allTS["13"]}
                                        x='t' y='mortalityMean'
                                        />

                                    </VictoryGroup>

                                    <VictoryArea
                                      style={{ data: { fill: "#00BFFF", stroke: "#00BFFF", fillOpacity: 0.1} }}
                                      data={stateFips && allTS[stateFips]? allTS[stateFips] : allTS["13"]}
                                      x= 't' y = 'mortalityMean'

                                    />

                                    
                                    <VictoryLabel text= {stateFips ? numberWithCommas((allTS[stateFips][allTS[stateFips].length - 1].dailyMortality).toFixed(0)) : numberWithCommas((allTS["13"][allTS["13"].length - 1].dailyMortality).toFixed(0))} x={80} y={80} textAnchor="middle" style={{fontSize: 40, fontFamily: 'lato', fill: "#004071"}}/>
                                    
                                    <VictoryLabel text= {stateFips ? 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0) > 0? (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0) + "%": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0)< 0? ((allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0)).substring(1) + "%": 
                                                        "0%"
                                                        : 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0) > 0? (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0) + "%": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0) < 0? ((allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0)).substring(1) + "%": 
                                                        "0%"} x={197} y={80} textAnchor="middle" style={{fontSize: 24, fontFamily: 'lato', fill: "#004071"}}/>

                                    <VictoryLabel text= {stateFips ? 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0) > 0? "↑": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0)< 0? "↓": ""
                                                        : 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0) > 0? "↑": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0)< 0?"↓": ""} 

                                                        x={160} y={80} textAnchor="middle" style={{fontSize: 24, fontFamily: 'lato'

                                                        , fill: stateFips ? 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0) > 0? "#FF0000": 
                                                        (allTS[stateFips][allTS[stateFips].length - 1].percent14dayDailyDeaths).toFixed(0)< 0? "#32CD32": ""
                                                        : 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0) > 0? "#FF0000": 
                                                        (allTS["13"][allTS["13"].length - 1].percent14dayDailyDeaths).toFixed(0)< 0?"#32CD32": ""}}/>

                                    <VictoryLabel text= {"14-day"}  x={197} y={100} textAnchor="middle" style={{fontSize: 12, fontFamily: 'lato', fill: "#004071"}}/>
                                    <VictoryLabel text= {"change"}  x={197} y={110} textAnchor="middle" style={{fontSize: 12, fontFamily: 'lato', fill: "#004071"}}/>
                                    <VictoryLabel text= {"Daily Deaths"}  x={110} y={20} textAnchor="middle" style={{fontSize: "19px", fontFamily: 'lato', fill: "#004071"}}/>

                        </VictoryChart>}
                      </div>
                    
                    </Grid.Column>
                    
                    <Header.Content style={{fontWeight: 300, paddingTop: 17, paddingLeft: 20,fontSize: "19px", width: 500}}>
                      
                      *14-day change trends use 7-day averages.
                    </Header.Content>
                  </Grid.Row>

                  <Grid.Row>
                    <Grid.Column style = {{paddingLeft: 20}}>
                      <Header as='h2' style={{fontWeight: 400, paddingTop: 10}}>
                        <Header.Content style={{width : 500, fontSize: "18pt", textAlign: "center"}}>
                          Disparities in COVID-19 Mortality <br/> <b>{fips !== "_nation" ? stateName : "Nation"}</b>
                          
                        </Header.Content>
                      </Header>

                      {stateFips && stateFips === "_nation" && <div style = {{marginTop: 13}}>
                              <Header.Content x={0} y={20} style={{fontSize: '14pt', paddingLeft: 130, fontWeight: 400, width: 400}}> Deaths by Race & Ethnicity</Header.Content>
                      </div>}

                      {stateFips && fips === "_nation" && <div style={{paddingLeft: "0em", paddingRight: "2em"}}>

                      <VictoryChart
                                theme={VictoryTheme.material}
                                width={400}
                                height={160}
                                domainPadding={20}
                                minDomain={{y: props.ylog?1:0}}
                                padding={{left: 164, right: 35, top: 12, bottom: 1}}
                                style = {{fontSize: "14pt"}}
                                containerComponent={<VictoryContainer responsive={false}/>}
                              >
                                <VictoryAxis style={{ticks:{stroke: "#000000"}, axis: {stroke: "#000000"}, grid: {stroke: "transparent"}, labels: {fill: '#000000', fontSize: "19px"}, tickLabels: {fontSize: "16px", fill: '#000000', fontFamily: 'lato'}}} />
                                <VictoryAxis dependentAxis style={{ticks:{stroke: "#000000"}, axis: {stroke: "#000000"}, grid: {stroke: "transparent"}, tickLabels: {fontSize: "19px", fill: '#000000', padding: 10,  fontFamily: 'lato'}}}/>
                                <VictoryBar
                                  horizontal
                                  barRatio={0.45}
                                  labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                  data={[
                                    {key: nationalDemog['Race'][0]['Hispanic'][0]['demogLabel'], 'value': nationalDemog['Race'][0]['Hispanic'][0]['deathrate']},
                                    {key: nationalDemog['Race'][0]['American Natives'][0]['demogLabel'], 'value': nationalDemog['Race'][0]['American Natives'][0]['deathrate']},
                                    {key: nationalDemog['Race'][0]['Asian'][0]['demogLabel'], 'value': nationalDemog['Race'][0]['Asian'][0]['deathrate']},
                                    {key: nationalDemog['Race'][0]['African American'][0]['demogLabel'], 'value': nationalDemog['Race'][0]['African American'][0]['deathrate']},
                                    {key: nationalDemog['Race'][0]['White'][0]['demogLabel'], 'value': nationalDemog['Race'][0]['White'][0]['deathrate']},
                                    
                                      


                                  ]}
                                  labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                  style={{
                                    data: {
                                      fill: "#004071"
                                    }
                                  }}
                                  x="key"
                                  y="value"
                                />
                              </VictoryChart>
                              <Header.Content style = {{width: 420}}>
                                  <Header.Content id="region" style={{ fontWeight: 300, paddingLeft: 150, paddingTop: 8, paddingBottom:34, fontSize: "19px", lineHeight: "18pt"}}>
                                    <b>Deaths per 100,000 residents</b>
                                  </Header.Content>
                              </Header.Content>
                    </div>}
                    
                          {fips !== "_nation" && !raceData[fips]["Non-Hispanic African American"] && !!raceData[fips]["White Alone"] && stateFips !== "38" &&
                          <Grid>
                            <Grid.Row columns = {2} style = {{height: 273, paddingBottom: 0}}>
                              <Grid.Column style = {{paddingLeft: 20}}> 
                                {!raceData[fips]["Non-Hispanic African American"]  && stateFips !== "02"  && 
                                  <div style = {{marginTop: 10, width: 250}}>
                                    <Header.Content x={0} y={20} style={{fontSize: '14pt', paddingLeft: 35, fontWeight: 400}}> Deaths by Race</Header.Content>
                                  </div>
                                }
                                {stateFips && !raceData[fips]["Non-Hispanic African American"] && stateFips !== "38"  && stateFips !== "02" &&
                                  <VictoryChart
                                                theme = {VictoryTheme.material}
                                                width = {250}
                                                height = {40 * (( !!raceData[fips]["Asian Alone"] && raceData[fips]["Asian Alone"][0]['deathrateRace'] >= 0 && raceData[fips]["Asian Alone"][0]["deaths"] > 30 && raceData[fips]["Asian Alone"][0]["percentPop"] >= 1 ? 1: 0) + 
                                                (!!raceData[fips]["American Natives Alone"] && raceData[fips]["American Natives Alone"][0]['deathrateRace'] >= 0 && raceData[fips]["American Natives Alone"][0]['deaths'] > 30 && raceData[fips]["American Natives Alone"][0]["percentPop"] >= 1 ? 1 : 0) + 
                                                (!!raceData[fips]["African American Alone"] && raceData[fips]["African American Alone"][0]['deathrateRace'] >= 0 && raceData[fips]["African American Alone"][0]['deaths'] > 30 && raceData[fips]["African American Alone"][0]["percentPop"] >= 1 ? 1 : 0) + 
                                                (!!raceData[fips]["White Alone"] && raceData[fips]["White Alone"][0]['deathrateRace'] >= 0 && raceData[fips]["White Alone"][0]['deaths'] > 30 && raceData[fips]["White Alone"][0]["percentPop"] >= 1 ?1:0))}
                                                domainPadding={20}
                                                minDomain={{y: props.ylog?1:0}}
                                                padding={{left: 80, right: 65, top: 12, bottom: 1}}
                                                style = {{fontSize: "14pt"}}
                                                containerComponent={<VictoryContainer responsive={false}/>}
                                              >

                                                <VictoryAxis style={{ticks:{stroke: "#000000"}, grid: {stroke: "transparent"}, axis: {stroke: "#000000"}, labels: {fill: '#000000', fontSize: "19px"}, tickLabels: {fontSize: "16px", fill: '#000000', fontFamily: 'lato'}}} />
                                                <VictoryAxis dependentAxis style={{ticks:{stroke: "#000000"}, grid: {stroke: "transparent"}, axis: {stroke: "#000000"}, labels: {fill: '#000000'}, tickLabels: {fontSize: "19px", fill: '#000000', padding: 10,  fontFamily: 'lato'}}}/>
                                                <VictoryGroup>
                                                
                                                {"Asian Alone" in raceData[fips] && raceData[fips]["Asian Alone"][0]['deathrateRace'] >= 0 && raceData[fips]["Asian Alone"][0]["deaths"] > 30 && raceData[fips]["Asian Alone"][0]["percentPop"] >= 1 && 
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    barRatio={0.7}
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "Asian", 'value': raceData[fips]["Asian Alone"][0]['deathrateRace'], 'label': numberWithCommas(raceData[fips]["Asian Alone"][0]['deathrateRace'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                {"American Natives Alone" in raceData[fips] && raceData[fips]["American Natives Alone"][0]['deathrateRace'] >= 0 && raceData[fips]["American Natives Alone"][0]['deaths'] > 30 && raceData[fips]["American Natives Alone"][0]["percentPop"] >= 1 &&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "American\n Natives", 'value': raceData[fips]["American Natives Alone"][0]['deathrateRace'], 'label': numberWithCommas(raceData[fips]["American Natives Alone"][0]['deathrateRace'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }


                                                {"African American Alone" in raceData[fips] && raceData[fips]["African American Alone"][0]['deathrateRace'] >= 0  && raceData[fips]["African American Alone"][0]['deaths'] > 30 && raceData[fips]["African American Alone"][0]["percentPop"] >= 1 && 
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "African\n American", 'value': raceData[fips]["African American Alone"][0]['deathrateRace'], 'label': numberWithCommas(raceData[fips]["African American Alone"][0]['deathrateRace'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                {"White Alone" in raceData[fips] && raceData[fips]["White Alone"][0]['deathrateRace'] >= 0  && raceData[fips]["White Alone"][0]['deaths'] > 30 && raceData[fips]["White Alone"][0]["percentPop"] >= 1 && 
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    barRatio={0.7}
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "White", 'value': raceData[fips]["White Alone"][0]['deathrateRace'], 'label': numberWithCommas(raceData[fips]["White Alone"][0]['deathrateRace'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                
                                                </VictoryGroup>
                                  </VictoryChart>
                                }
                                {!raceData[fips]["Non-Hispanic African American"] && stateFips !== "38" && stateFips !== "02" &&
                                  <div style = {{marginTop: 10, textAlign: "center", width: 250}}>
                                    <Header.Content x={15} y={20} style={{fontSize: '14pt', paddingLeft: 15, fontWeight: 400}}> Deaths per 100,000 <br/> residents</Header.Content>
                                  </div>
                                }

                                {stateFips === "02" &&
                                  <div style = {{marginTop: 10, width: 250}}>
                                    <text x={0} y={20} style={{fontSize: '14pt', paddingLeft: 35, fontWeight: 400}}> Deaths by Race</text>

                                    <text x={0} y={20} style={{fontSize: '14pt', paddingLeft: 0, fontWeight: 400}}> <br/> <br/> <br/> 
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    None Reported</text>
                                  </div>
                                }

                              </Grid.Column>
                              <Grid.Column style = {{paddingLeft: 50}}> 
                                {!!raceData[fips]["White Alone"] && stateFips !== "38" &&
                                  <div style = {{marginTop: 10}}>
                                    <Header.Content x={0} y={20} style={{fontSize: '14pt', paddingLeft: 35, fontWeight: 400, width: 250}}> Deaths by Ethnicity</Header.Content>
                                    {!(stateFips && !!raceData[fips]["White Alone"] && fips !== "38" && !(raceData[fips]["Hispanic"][0]['deathrateEthnicity'] < 0 || (!raceData[fips]["Hispanic"] && !raceData[fips]["Non Hispanic"] && !raceData[fips]["Non-Hispanic African American"] && !raceData[fips]["Non-Hispanic American Natives"] && !raceData[fips]["Non-Hispanic Asian"] && !raceData[fips]["Non-Hispanic White"] ) ))
                                        && 
                                      <center> <Header.Content x={0} y={20} style={{fontSize: '14pt', paddingLeft: 20, fontWeight: 400, width: 250}}> <br/> <br/> None Reported</Header.Content> </center>

                                  }
                                  </div>
                                }
                                {stateFips && !!raceData[fips]["White Alone"] && fips !== "38" && !(raceData[fips]["Hispanic"][0]['deathrateEthnicity'] < 0 || (!raceData[fips]["Hispanic"] && !raceData[fips]["Non Hispanic"] && !raceData[fips]["Non-Hispanic African American"] && !raceData[fips]["Non-Hispanic American Natives"] && !raceData[fips]["Non-Hispanic Asian"] && !raceData[fips]["Non-Hispanic White"] ) ) && 
                                  <VictoryChart
                                                theme = {VictoryTheme.material}
                                                width = {250}
                                                height = {!!raceData[fips]["Hispanic"] && !!raceData[fips]["Non Hispanic"] ?  81 : 3 * (!!raceData[fips]["Hispanic"] + !!raceData[fips]["Non Hispanic"] + !!raceData[fips]["Non-Hispanic African American"] + !!raceData[fips]["Non-Hispanic American Natives"] + !!raceData[fips]["Non-Hispanic Asian"] + !!raceData[fips]["Non-Hispanic White"] )}
                                                domainPadding={20}
                                                minDomain={{y: props.ylog?1:0}}
                                                padding={{left: 110, right: 35, top: !!raceData[fips]["Hispanic"] && !!raceData[fips]["Non Hispanic"] ? 13 : 10, bottom: 1}}
                                                style = {{fontSize: "14pt"}}
                                                containerComponent={<VictoryContainer responsive={false}/>}
                                              >

                                                <VictoryAxis style={{ticks:{stroke: "#000000"}, grid: {stroke: "transparent"}, axis: {stroke: "#000000"}, labels: {fill: '#000000', fontSize: "19px"}, tickLabels: {fontSize: "16px", fill: '#000000', fontFamily: 'lato'}}} />
                                                <VictoryAxis dependentAxis style={{ticks:{stroke: "#000000"}, grid: {stroke: "transparent"}, axis: {stroke: "#000000"}, labels: {fill: '#000000'}, tickLabels: {fontSize: "19px", fill: '#000000', padding: 10,  fontFamily: 'lato'}}}/>
                                                
                                                  <VictoryGroup>



                                                  {(!!raceData[fips]["Hispanic"] || (!!raceData[fips]["Hispanic"] && !!raceData[fips]["White Alone"] && raceData[fips]["Hispanic"][0]['deathrateEthnicity'] >= 0  && raceData[fips]["Hispanic"][0]['deaths'] > 30 && raceData[fips]["Hispanic"][0]["percentPop"] >= 1))&&
                                                    <VictoryBar
                                                      barWidth= {10}
                                                      barRatio={0.1}
                                                      horizontal
                                                      labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                      data={[

                                                            {key: "Hispanic", 'value': raceData[fips]["Hispanic"][0]['deathrateEthnicity'], 'label': numberWithCommas(raceData[fips]["Hispanic"][0]['deathrateEthnicity'])}

                                                      ]}
                                                      labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                      style={{
                                                        data: {
                                                          fill: "#004071"
                                                        }
                                                      }}
                                                      x="key"
                                                      y="value"
                                                    />
                                                  }

                                                  {!!raceData[fips]["Non Hispanic"] && !!raceData[fips]["White Alone"] && raceData[fips]["Non Hispanic"][0]['deathrateEthnicity'] >= 0  && raceData[fips]["Non Hispanic"][0]['deaths'] > 30 && raceData[fips]["Non Hispanic"][0]["percentPop"] >= 1 &&
                                                    <VictoryBar
                                                      barWidth= {10}
                                                      barRatio={0.1}
                                                      horizontal
                                                      labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                      data={[

                                                            {key: "Non Hispanic", 'value': raceData[fips]["Non Hispanic"][0]['deathrateEthnicity'], 'label': numberWithCommas(raceData[fips]["Non Hispanic"][0]['deathrateEthnicity'])}

                                                      ]}
                                                      labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                      style={{
                                                        data: {
                                                          fill: "#004071"
                                                        }
                                                      }}
                                                      x="key"
                                                      y="value"
                                                    />
                                                  }
                                                  
                                                
                                                  {!!raceData[fips]["Non-Hispanic African American"] && raceData[fips]["Non-Hispanic African American"][0]['deathrateRaceEthnicity'] >= 0  && raceData[fips]["Non-Hispanic African American"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic African American"][0]["percentPop"] >= 1 &&
                                                    <VictoryBar
                                                      barWidth= {10}
                                                      horizontal
                                                      barRatio={0.7}
                                                      labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                      data={[

                                                            {key: "African\n American", 'value': raceData[fips]["Non-Hispanic African American"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic African American"][0]['deathrateRaceEthnicity'])}

                                                      ]}
                                                      labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                      style={{
                                                        data: {
                                                          fill: "#004071"
                                                        }
                                                      }}
                                                      x="key"
                                                      y="value"
                                                    />
                                                  }

                                                  {!!raceData[fips]["Non-Hispanic American Natives"] && raceData[fips]["Non-Hispanic American Natives"][0]['deathrateRaceEthnicity'] >= 0 && raceData[fips]["Non-Hispanic American Natives"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic American Natives"][0]["percentPop"] >= 1 &&
                                                    <VictoryBar
                                                      barWidth= {10}
                                                      horizontal
                                                      barRatio={0.7}
                                                      labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                      data={[

                                                            {key: "American\n Natives", 'value': raceData[fips]["Non-Hispanic American Natives"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic American Natives"][0]['deathrateRaceEthnicity'])}

                                                      ]}
                                                      labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                      style={{
                                                        data: {
                                                          fill: "#004071"
                                                        }
                                                      }}
                                                      x="key"
                                                      y="value"
                                                    />
                                                  }

                                                  {!!raceData[fips]["Non-Hispanic Asian"] && raceData[fips]["Non-Hispanic Asian"][0]['deathrateRaceEthnicity'] >= 0  && raceData[fips]["Non-Hispanic Asian"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic Asian"][0]["percentPop"] >= 1 &&
                                                    <VictoryBar
                                                      barWidth= {10}
                                                      horizontal
                                                      barRatio={0.7}
                                                      labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                      data={[

                                                            {key: "Asian", 'value': raceData[fips]["Non-Hispanic Asian"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic Asian"][0]['deathrateRaceEthnicity'])}

                                                      ]}
                                                      labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                      style={{
                                                        data: {
                                                          fill: "#004071"
                                                        }
                                                      }}
                                                      x="key"
                                                      y="value"
                                                    />
                                                  }
                                                  {!!raceData[fips]["Non-Hispanic White"] && raceData[fips]["Non-Hispanic White"][0]['deathrateRaceEthnicity'] >= 0  && raceData[fips]["Non-Hispanic White"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic White"][0]["percentPop"] >= 1 &&
                                                    <VictoryBar
                                                      barWidth= {10}
                                                      horizontal
                                                      barRatio={0.7}
                                                      labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                      data={[

                                                            {key: "White", 'value': raceData[fips]["Non-Hispanic White"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic White"][0]['deathrateRaceEthnicity'])}

                                                      ]}
                                                      labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                      style={{
                                                        data: {
                                                          fill: "#004071"
                                                        }
                                                      }}
                                                      x="key"
                                                      y="value"
                                                    />
                                                  }

                                                  
                                                  </VictoryGroup>
                                          

                                  </VictoryChart>
                                }
                                {fips !== "_nation" && !!raceData[fips]["White Alone"] && fips !== "38" && !(raceData[fips]["Hispanic"][0]['deathrateEthnicity'] < 0 || (!raceData[fips]["Hispanic"] && !raceData[fips]["Non Hispanic"] && !raceData[fips]["Non-Hispanic African American"] && !raceData[fips]["Non-Hispanic American Natives"] && !raceData[fips]["Non-Hispanic Asian"] && !raceData[fips]["Non-Hispanic White"] ) ) && 
                                  <div style = {{marginTop: 10, textAlign: "center", width: 250}}>
                                    <Header.Content style={{fontSize: '14pt', paddingLeft: 35, fontWeight: 400}}> Deaths per 100,000 <br/> &nbsp;&nbsp;&nbsp;&nbsp;residents</Header.Content>
                                  </div>
                                }

                                
                              </Grid.Column>
                            </Grid.Row>
                          </Grid>
                          }

                          {fips !== "_nation" && (!!raceData[fips]["Non-Hispanic African American"] || !!raceData[fips]["Non-Hispanic White"] ) && fips !== "38" &&
                          <Grid.Row columns = {1}>
                            <Grid.Column style = {{ marginLeft : 0, paddingBottom: (13+ 2 * (!raceData[fips]["Hispanic"] + !raceData[fips]["Non Hispanic"] + !raceData[fips]["Non-Hispanic African American"] + !raceData[fips]["Non-Hispanic American Natives"] + !raceData[fips]["Non-Hispanic Asian"] + !raceData[fips]["Non-Hispanic White"] ))}}> 
                              {stateFips && !raceData[fips]["White Alone"] &&
                                <div style = {{marginTop:10, width: 400}}>
                                  <Header.Content x={0} y={20} style={{fontSize: '14pt', paddingLeft: 150, fontWeight: 400}}> Deaths by Race & Ethnicity</Header.Content>
                                </div>
                              }
                              {stateFips && !raceData[fips]["White Alone"] && stateFips !== "38" &&
                              <div style={{paddingLeft: "1em", paddingRight: "0em", width: 550}}>
                                <VictoryChart
                                              theme = {VictoryTheme.material}
                                              width = {400}
                                              height = {32 * (!!raceData[fips]["Hispanic"] + !!raceData[fips]["Non Hispanic"] + !!raceData[fips]["Non-Hispanic African American"] + !!raceData[fips]["Non-Hispanic American Natives"] + !!raceData[fips]["Non-Hispanic Asian"] + !!raceData[fips]["Non-Hispanic White"] )}
                                              domainPadding={20}
                                              minDomain={{y: props.ylog?1:0}}
                                              padding={{left: 150, right: 35, top: !!raceData[fips]["Hispanic"] && !!raceData[fips]["Non Hispanic"] ? 12 : 10, bottom: 1}}
                                              style = {{fontSize: "14pt"}}
                                              containerComponent={<VictoryContainer responsive={false}/>}
                                            >

                                              <VictoryAxis style={{ticks:{stroke: "#000000"}, grid: {stroke: "transparent"}, axis: {stroke: "#000000"}, labels: {fill: '#000000', fontSize: "19px"}, tickLabels: {fontSize: "16px", fill: '#000000', fontFamily: 'lato'}}} />
                                              <VictoryAxis dependentAxis style={{ticks:{stroke: "#000000"}, grid: {stroke: "transparent"}, axis: {stroke: "#000000"}, labels: {fill: '#000000'}, tickLabels: {fontSize: "19px", fill: '#000000', padding: 10,  fontFamily: 'lato'}}}/>
                                              
                                                <VictoryGroup>

                                                {(!!raceData[fips]["Hispanic"] || (!!raceData[fips]["Hispanic"] && !!raceData[fips]["White Alone"] && raceData[fips]["Hispanic"][0]['deathrateEthnicity'] >= 0  && raceData[fips]["Hispanic"][0]['deaths'] > 30 && raceData[fips]["Hispanic"][0]["percentPop"] >= 1 ))&&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    barRatio={0.1}
                                                    horizontal
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "Hispanic", 'value': raceData[fips]["Hispanic"][0]['deathrateEthnicity'], 'label': numberWithCommas(raceData[fips]["Hispanic"][0]['deathrateEthnicity'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                {!!raceData[fips]["Non Hispanic"] && !!raceData[fips]["White Alone"] && raceData[fips]["Non Hispanic"][0]['deathrateEthnicity'] >= 0  && raceData[fips]["Non Hispanic"][0]['deaths'] > 30 && raceData[fips]["Non Hispanic"][0]["percentPop"] >= 1 &&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    barRatio={0.1}
                                                    horizontal
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "Non Hispanic", 'value': raceData[fips]["Non Hispanic"][0]['deathrateEthnicity'], 'label': numberWithCommas(raceData[fips]["Non Hispanic"][0]['deathrateEthnicity'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }
                                                
                                                {!!raceData[fips]["Non-Hispanic African American"] && raceData[fips]["Non-Hispanic African American"][0]['deathrateRaceEthnicity'] >= 0  && raceData[fips]["Non-Hispanic African American"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic African American"][0]["percentPop"] >= 1 &&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    barRatio={0.7}
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "African American", 'value': raceData[fips]["Non-Hispanic African American"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic African American"][0]['deathrateRaceEthnicity'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                {!!raceData[fips]["Non-Hispanic American Natives"] && raceData[fips]["Non-Hispanic American Natives"][0]['deathrateRaceEthnicity'] >= 0  && raceData[fips]["Non-Hispanic American Natives"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic American Natives"][0]["percentPop"] >= 1 &&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    barRatio={0.7}
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "American Natives", 'value': raceData[fips]["Non-Hispanic American Natives"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic American Natives"][0]['deathrateRaceEthnicity'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                {!!raceData[fips]["Non-Hispanic Asian"] && raceData[fips]["Non-Hispanic Asian"][0]['deathrateRaceEthnicity'] >= 0  && raceData[fips]["Non-Hispanic Asian"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic Asian"][0]["percentPop"] >= 1 &&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    barRatio={0.7}
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "Asian", 'value': raceData[fips]["Non-Hispanic Asian"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic Asian"][0]['deathrateRaceEthnicity'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }
                                                {!!raceData[fips]["Non-Hispanic White"] && raceData[fips]["Non-Hispanic White"][0]['deathrateRaceEthnicity'] >= 0 && raceData[fips]["Non-Hispanic White"][0]['deaths'] > 30 && raceData[fips]["Non-Hispanic White"][0]["percentPop"] >= 1 &&
                                                  <VictoryBar
                                                    barWidth= {10}
                                                    horizontal
                                                    barRatio={0.7}
                                                    labels={({ datum }) => numberWithCommas(parseFloat(datum.value).toFixed(0))}
                                                    data={[

                                                          {key: "White", 'value': raceData[fips]["Non-Hispanic White"][0]['deathrateRaceEthnicity'], 'label': numberWithCommas(raceData[fips]["Non-Hispanic White"][0]['deathrateRaceEthnicity'])}

                                                    ]}
                                                    labelComponent={<VictoryLabel dx={5} style={{ fontFamily: 'lato', fontSize: "19px", fill: "#000000" }}/>}
                                                    style={{
                                                      data: {
                                                        fill: "#004071"
                                                      }
                                                    }}
                                                    x="key"
                                                    y="value"
                                                  />
                                                }

                                                
                                                </VictoryGroup>
                                        

                                </VictoryChart>
                                </div>
                              }
                              {stateFips && !raceData[fips]["White Alone"] &&
                                <div style = {{marginTop: 10, width: 400, paddingBottom: 3}}>
                                  <Header.Content style={{fontSize: '19px', marginLeft: 150, fontWeight: 400}}> Deaths per 100,000 residents<br/> 
                                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                  
                                  
                                  </Header.Content>
                                </div>
                              }

                            </Grid.Column>
                          </Grid.Row>}

                          {stateFips === "38" &&
                            <Grid.Row columns = {1}>
                            <Grid.Column style = {{ marginLeft : 0, paddingTop: 8, paddingBottom: 87, width: 500}}> 
                                <div style = {{marginTop: 50}}>
                                  <text x={0} y={20} style={{fontSize: '14pt', paddingLeft: 90, fontWeight: 400}}> Deaths per capita by Race & Ethnicity <br/> <br/> <br/> <br/> </text>
                                  <text style={{fontSize: '14pt', paddingLeft: 190, fontWeight: 400}}> None Reported</text>
                                </div>                            
                            </Grid.Column>
                          </Grid.Row>
                          }

                          {stateFips && <Accordion id = "select" style = {{paddingTop: 10, paddingLeft: 10}}defaultActiveIndex={1} panels={[
                            {
                                key: 'acquire-dog',
                                title: {
                                    content: <u style={{ fontFamily: 'lato', fontSize: "19px", color: "#397AB9"}}>About the data</u>,
                                    icon: 'dropdown',
                                },
                                content: {
                                    content: (
                                      <div>
                                        {stateFips && stateFips === "_nation" && <Grid.Row style= {{paddingTop: 0, paddingBottom: 53}}> 
                                          <Header.Content style={{fontWeight: 300, fontSize: "14pt", paddingTop: 7, lineHeight: "18pt", width: 450}}>
                                            The United States reports deaths by combined race and ethnicity groups. The chart shows race and ethnicity groups that constitute at least 1% of the state population and have 30 or more deaths. Race and ethnicity data are known for {nationalDemog['Race'][0]['Unknown Race'][0]['availableDeaths'] + "%"} of deaths in the nation.
                                            <br/>
                                            <br/> <i>Data source</i>: <a style ={{color: "#397AB9"}} href = "https://www.cdc.gov/diabetes/data/index.html" target = "_blank" rel="noopener noreferrer"> The CDC </a>
                                            <br/><b>Data last updated:</b> {date}, updated every weekday.<br/>
                                          
                                          </Header.Content>
                                        </Grid.Row>}

                                        {stateFips && fips !== "_nation" && <Grid.Row style={{top: fips === "38"? -30 : stateFips && !raceData[fips]["White Alone"] ? -40 : -30, paddingLeft: 0}}>
                                        

                                        

                                        {fips === "38" &&
                                          <Header.Content style={{fontWeight: 300, fontSize: "14pt", paddingTop: 7, lineHeight: "18pt", width: 450}}>
                                            {stateName} is not reporting deaths by race or ethnicity.
                                            <br/>
                                            <br/> <i>Data source</i>: <a style ={{color: "#397AB9"}} href = "https://covidtracking.com/about-data" target = "_blank" rel="noopener noreferrer"> The COVID Tracking Project </a>
                                            <br/><b>Data last updated:</b> {date}, updated every weekday.<br/>
                                          
                                          </Header.Content>}

                                        {stateFips !== "38" && !raceData[fips]["Non-Hispanic African American"] && !!raceData[fips]["White Alone"] && (!raceData[fips]["Non Hispanic"] && !raceData[fips]["Non-Hispanic American Natives"] && !raceData[fips]["Non-Hispanic Asian"] && !raceData[fips]["Non-Hispanic White"] )
                                                    && 
                                          <Header.Content style={{fontWeight: 300, fontSize: "14pt", paddingTop: 7, lineHeight: "18pt", width: 450}}>
                                            {stateName} reports deaths by race. The chart shows race groups that constitutes at least 1% of the state population and have 30 or more deaths. Race data are known for {raceData[fips]["Race Missing"][0]["percentRaceDeaths"] + "%"} of deaths in {stateName}.
                                            <br/>
                                            <br/> <i>Data source</i>: <a style ={{color: "#397AB9"}} href = "https://covidtracking.com/about-data" target = "_blank" rel="noopener noreferrer"> The COVID Tracking Project </a>
                                            <br/><b>Data last updated:</b> {date}, updated every weekday.<br/>
                                          
                                          </Header.Content>}

                                        {stateFips !== "38"  && !!raceData[fips]["White Alone"] && !!raceData[fips]["White Alone"] && !(!raceData[fips]["Hispanic"] && !raceData[fips]["Non Hispanic"] && !raceData[fips]["Non-Hispanic African American"] && !raceData[fips]["Non-Hispanic American Natives"] && !raceData[fips]["Non-Hispanic Asian"] && !raceData[fips]["Non-Hispanic White"] )
                                                    && 
                                          <Header.Content style={{fontWeight: 300, fontSize: "14pt", paddingTop: 7, lineHeight: "18pt", width: 450}}>
                                            {stateName} reports deaths by race and ethnicity separately. The chart shows race and ethnicity groups that constitute at least 1% of the state population and have 30 or more deaths. Race data are known for {raceData[fips]["Race Missing"][0]["percentRaceDeaths"] + "%"} of deaths while ethnicity data are known for {raceData[fips]["Ethnicity Missing"][0]["percentEthnicityDeaths"] + "%"} of deaths in {stateName}.
                                            <br/>
                                            <br/> <i>Data source</i>: <a style ={{color: "#397AB9"}} href = "https://covidtracking.com/about-data" target = "_blank" rel="noopener noreferrer"> The COVID Tracking Project </a>
                                            <br/><b>Data last updated:</b> {date}, updated every weekday.<br/>
                                          
                                          </Header.Content>}

                                        {stateFips !== "38"  && (!!raceData[fips]["Non-Hispanic African American"] || !!raceData[fips]["Non-Hispanic White"] ) && 
                                          <Header.Content style={{fontWeight: 300, fontSize: "14pt", paddingTop: 7, lineHeight: "18pt", width: 450}}>
                                            {stateName} reports deaths by combined race and ethnicity groups. The chart shows race and ethnicity groups that constitute at least 1% of the state population and have 30 or more deaths. Race and ethnicity data are known for {raceData[fips]["Race & Ethnicity Missing"][0]["percentRaceEthnicityDeaths"] + "%"} of deaths in {stateName}.
                                            <br/>
                                            <br/> <i>Data source</i>: <a style ={{color: "#397AB9"}} href = "https://covidtracking.com/about-data" target = "_blank" rel="noopener noreferrer"> The COVID Tracking Project </a>
                                            <br/><b>Data last updated:</b> {date}, updated every weekday.<br/>
                                          
                                          </Header.Content>}

                                          {!raceData[fips]["Non-Hispanic African American"]  && stateFips !== "02"  && 
                                              <div style = {{marginTop: 10}}>
                                              </div>
                                            }

                                        </Grid.Row>}

                                      </div>
                                    ),
                                  },
                              }
                          ]

                          } /> }
                          
                          


                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                </Grid.Column>
                <Grid.Column>
                  
                  <div style = {{width: 1000, height: 180}}>
                    { dataTS && <CaseChart data={dataTS} lineColor={[colorPalette[1]]} stateFips = {stateFips}
                          ticks={caseTicks} tickFormatter={caseTickFmt} labelFormatter = {labelTickFmt} var = {"caserate7dayfig"}/>
                    }  
                  </div>
                  
                </Grid.Column>

              </Grid.Row>

              {/* <Grid.Row>
                <Header as='h2' style={{fontWeight: 400, paddingTop: 70}}>
                  <Header.Content style={{width : 900, fontSize: "18pt"}}>
                    Vaccination FAQs
                    
                  </Header.Content>
                </Header>
              </Grid.Row> */}
              </Grid>
            </Grid.Column>
          </Grid>
          
          <Container id="title" style={{marginTop: '8em', minWidth: '1260px'}}>
            <Notes />
          </Container>
        </Container>
        <ReactTooltip > <font size="+2"><b >{stateName}</b> </font> <br/>  <b>Click for county-level data.</b> </ReactTooltip>
      </div>
      );
  } else {
    return <Loader active inline='centered' />
  }
}