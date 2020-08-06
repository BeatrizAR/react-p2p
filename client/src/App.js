import React,{ useEffect, useState, useRef } from 'react';
import './App.css';
import io from "socket.io-client"
import Peer from 'simple-peer'
import styled from 'styled-components'
import {Button} from 'react-bootstrap'
import { AiOutlineAudioMuted,AiOutlineAudio } from "react-icons/ai";
import {SignalData} from 'simple-peer';

const socket = io.connect('http://localhost:8000')

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  width: 100%
`

const Video = styled.video`
  border: 1px solid blue;
  width: 50%;
  height: 50%;
`;

function App() {
  const [yourID, setYourID] = useState("")
  const [users, setUsers] = useState({})
  const [stream, setStream] = useState()
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState("")
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [enable,setEnable] = useState(false)

  const userVideo = useRef()
  const partnerVideo = useRef()
  const socket = useRef()

  useEffect(() => {
  // const call = () => {
    
    // if(enable === false){
      socket.current = io.connect("/")

      socket.current.on("yourID",(id) => {
        setYourID(id)
      })
      socket.current.on("allUsers", (users) => {
        setUsers(users)
      })

      socket.current.on("hey", (data) => {
        setReceivingCall(true)
        setCaller(data.from)
        setCallerSignal(data.signal)
      })

      // setEnable(true)
    // }else{
      
      // setEnable(false)
    // }
  }, [])
  // }

  function callPeer(id) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {

        config: {'iceServers': [
          { url: 'stun:stun.l.google.com:19302' },
          { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
        ]}
    },
      stream: stream,
    });

    peer.on("signal", data => {
      socket.current.emit("callUser", { userToCall: id, signalData: data, from: yourID })
    })

    peer.on("stream", stream => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.current.on("callAccepted", signal => {
      setCallAccepted(true);
      peer.signal(signal);
    })

  }

  const call = () =>{

    if(enable ===false){
      navigator.mediaDevices.getUserMedia({ video:false, audio:true })
        .then(stream => {
          setStream(stream.getAudioTracks())
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
            setEnable(true)
          }
        })
        .catch(err => {
          alert(`getUserMedia() error: ${err.name}`);
        }); 

      setCallAccepted(true);
      // const peer = new Peer({
      //   initiator: false,
      //   trickle: false,
      //   stream: stream,
      // });
      // peer.on("signal", data => {
      //   socket.current.emit("acceptCall", { signal: data, to: caller })
      // })
    
      // peer.on("stream", stream => {
      //   partnerVideo.current.srcObject = stream;
      // });
    
      // peer.signal(callerSignal);
    }else{
      setEnable(false)
      setStream()
    }
  }
  

  function acceptCall() {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", data => {
      socket.current.emit("acceptCall", { signal: data, to: caller })
    })

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  }

  let UserVideo;
  if (stream) {
    UserVideo = (
      <audio playsInline ref={userVideo} autoPlay />
    );
  }

  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <audio playsInline ref={partnerVideo} autoPlay />
    );
  }

  let incomingCall;
  if (receivingCall) {
    incomingCall = (
      <div>
        <h1>{caller} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    )
  }

  const handleSucess = (stream) => {
    stream.getAudioTracks()

  }

  return (
    <Container>
      <Row>
        {UserVideo}
        {PartnerVideo}
      </Row>
      <Row>
        {Object.keys(users).map(key => {
          if (key === yourID) {
            return null;
          }
          return (
            <button onClick={() => callPeer(key)}>Call {key}</button>
          );
        })}
      </Row>
      <Row>
        {incomingCall}
        <Button onClick={call}>
          {enable ? <AiOutlineAudioMuted/> : <AiOutlineAudio/>}
        </Button>
      </Row>
    </Container>
  );
}

export default App;
