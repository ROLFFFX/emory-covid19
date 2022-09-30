import {
  Container,
  Breadcrumb,
  Dropdown,
  Header,
  Grid,
  Progress,
  Loader,
  Divider,
  Popup,
  Table,
  Button,
  Image,
  Rail,
  Sticky,
  Ref,
  Segment,
  Accordion,
  Icon,
  Checkbox,
  Menu,
  Message,
  Transition,
  List,
} from "semantic-ui-react";
import React, {
  useEffect,
  useState,
  useRef,
  createRef,
  PureComponent,
} from "react";
import { Link } from "react-router-dom";
import HeaderSubHeader from "semantic-ui-react/dist/commonjs/elements/Header/HeaderSubheader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faQuestionCircle,
} from "@fortawesome/free-regular-svg-icons";
import { useCookie } from "react-use";
import { decision_aid } from "../../stitch/mongodb";

function FinalDecision() {
  const choices = [
    "I have decided to get the COVID-19 vaccine",
    "I need to discuss the decision further with my family and doctor",
    "I need to learn more about COVID-19 and the COVID-19 vaccine",
    "I have decided not get the COVID-19 vaccine",
    "Other",
  ];
  const recommendations = [
    {
      next: "Get in touch with your doctor, pharmacist or vaccine hub and make an appointment to get the COVID-19 vaccine. For information about government-run vaccination services, check with your local Department of Health.",
      share:
        "You can help us to improve this Decision Aid in the future by sharing your decision with us. Just click the ‘send’ button below. The information you share will be anonymous and confidential and will only be shared with the Decision Aid team.",
    },
    {
      next: "Make time to talk to your family about the benefits and risks of getting a COVID-19 vaccine. Also make an appointment with your doctor so you can talk through any concerns you may have.",
      share:
        "You can help us to improve this Decision Aid in the future by sharing your decision with us. Just click the ‘send’ button below. The information you share will be anonymous and confidential and will only be shared with the Decision Aid team. ",
    },
    {
      next: "It is important that you get information about the benefits and risks of COVID-19 vaccination from credible sources. Your doctor will be able to answer your questions. They will also be able to recommend other good sources of information. The Useful Links section on this page also lists a number of reliable information sources.",
      share:
        "You can help us to improve this Decision Aid in the future by sharing your decision with us. Just click the ‘send’ button below. The information you share will be anonymous and confidential and will only be shared with the Decision Aid team. ",
    },
    {
      next: "Do what you can to stay safe and healthy. Social distancing, mask-wearing and frequent hand-washing can help reduce your risk of catching the virus. You may also find that you are not able to work in certain workplaces where vaccinations are compulsory. You could find it useful to revisit this Decision Aid in the future.",
      share:
        "You can help us to improve this Decision Aid in the future by sharing your decision with us. Just click the ‘send’ button below. The information you share will be anonymous and confidential and will only be shared with the Decision Aid team. ",
    },
  ];
  const [checkedBoxes, setCheckedBoxes] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [cookies, setCookie, removeCookie] = useCookie(["decision_aid"]);
  const [choiceIndex, setChoiceIndex] = useState(null);
  console.log(cookies);
  function handleSubmit() {
    const cookies_arr = cookies.slice(1, -1).split(",");
    const num_arr = [];

    cookies_arr.forEach((str) => {
      num_arr.push(Number(str));
    });
    console.log(num_arr);
    console.log(checkedBoxes);
    try {
      decision_aid.insertOne({
        step1: { type: "slider", value: num_arr },
        step2: { type: "check box", value: checkedBoxes },
      });
    } catch (e) {
      console.log(e);
    }
  }

  console.log(choiceIndex);
  console.log(recommendations);

  return (
    <div style={{ marginLeft: "20%", width: "60%" }}>
      <Header
        as="h4"
        style={{ paddingTop: 30, fontWeight: 500, fontSize: "1.5rem" }}
      >
        <Header.Content>
          We hope the information in this decision aid has helped you to make a
          decision. Select from the options below to see what your next steps
          will be.
        </Header.Content>
      </Header>
      <div>
        {choices.map((choice, index) => {
          return (
            <Checkbox
              onClick={(e) => {
                var temp = [false, false, false, false, false];
                temp[index] = true;
                setCheckedBoxes(temp);
                setChoiceIndex(index);
              }}
              checked={checkedBoxes[index]}
              style={{
                fontSize: "1.25rem",
                display: "block",
                marginTop: "10px",
              }}
              label={choice}
            />
          );
        })}
      </div>
      <Link to="/decision-aid/about">
        <button
          onClick={handleSubmit}
          type="submit"
          style={{ marginTop: "3rem" }}
          class="ui large primary button"
        >
          Submit
        </button>
      </Link>

      {(choiceIndex || choiceIndex === 0) && choiceIndex !== 4 && (
        <>
          <div>
            <b>Your next step</b>
            <p>{recommendations[choiceIndex].next}</p>
            <b>Share your decision with us</b>
            <p>{recommendations[choiceIndex].share}</p>
          </div>
        </>
      )}
      {choiceIndex && choiceIndex === 4 && (
        <>
          <input></input>
        </>
      )}
    </div>
  );
}
export default FinalDecision;
