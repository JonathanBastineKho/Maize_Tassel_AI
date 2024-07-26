import { Avatar } from "flowbite-react";
import React, { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { FaLocationArrow, FaSeedling, FaListUl } from "react-icons/fa";
import { IoMdAttach, IoMdClose } from "react-icons/io";
import { parse } from 'best-effort-json-parser';
import { AuthContext } from "../../Authentication/AuthContext";
import { PiStarFourFill } from "react-icons/pi";
import { FaYoutube } from "react-icons/fa";
import { MdOutlinePhotoCamera } from "react-icons/md";
import ReactMarkdown from 'react-markdown';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const YouTubeCard = ({ link }) => {
    const videoId = link.split('v=')[1];
    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <iframe 
                width="100%" 
                height="200" 
                src={`https://www.youtube.com/embed/${videoId}`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            ></iframe>
            <div className="p-4">
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Watch on YouTube
                </a>
            </div>
        </div>
    );
};

function ChatPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [chatHistory, setChatHistory] = useState([]); // To display in the frontend
    const [youtubeLinks, setYoutubeLinks] = useState([]);
    const [context, setContext] = useState(null); // For the API call
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);

    const [generating, setGenerating] = useState(false);
    const [quota, setQuota] = useState(null);
    const textRef = useRef(null);
    const fileInputRef = useRef(null);
    const handleSendMessage = useCallback(async () => {
        setGenerating(true);
        setChatHistory((prev) => ([...prev, {user: true, chat: input, image: file}, {user: false}]));
        const formData = new FormData();
        formData.append('text', input);
        if (context !== null){
            formData.append('chat_history', context);
        }
        if (file) {
            formData.append('image', file);
        }
        setInput(''); setFile(null);
        textRef.current.textContent = '';
        const res = await fetch("/api/ai/chat-disease", {
            method: 'POST',
            body: formData
        });
        const data = res.body;
        if (data) {
            const reader = data.getReader();
            const decoder = new TextDecoder();
            let done = false;

            let buffer = "";
            let parsedResult = {};

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                buffer += chunkValue;

                parsedResult = parse(buffer);
                setChatHistory((prev) => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].chat = parsedResult;
                    return newHistory;
                });
                    
                if (parse.lastParseReminding) {
                    setContext(parse(parse.lastParseReminding).chat_history);
                }
            }
            if (parsedResult.youtube_search_keyword !== undefined) {
                if (parsedResult.youtube_search_keyword !== ''){
                    axios.get("/api/ai/search-youtube", {
                        params: {
                            search: parsedResult?.youtube_search_keyword
                        }
                    })
                    .then((res) => {
                        if (res.status === 200) {
                            setYoutubeLinks((prev) => [...prev, res.data.youtube])
                        }
                    })
                    .catch((err) => {
                        setYoutubeLinks((prev) => [...prev, []])
                    })
                } else {
                    setYoutubeLinks((prev) => [...prev, []])
                }
            } else {
                setYoutubeLinks((prev) => [...prev, []])
            }
            setQuota(quota+1);
            setGenerating(false);
        }
        
    }, [input, file])

    useEffect(() => {
        axios.get("/api/ai/get-quota")
        .then((res) => {
            if (res.status === 200){
                setQuota(res.data.count);
            }
        })
        .catch((err) => {
            if (err.response.status === 401){
                navigate("/login");
            }
        })
    }, [])

    return (
        <div className="pt-24 px-5 relative h-screen flex flex-col gap-4 max-w-[80rem] mx-auto">
            {/* Chat History */}
            <div className={`flex-1 flex flex-col gap-5 overflow-y-auto ${chatHistory.length > 0 ? 'py-5' : ''}`}>
                {chatHistory.length === 0 ? (
                    <>
                        <div className="p-6 flex flex-col ">
                            <h1 className="tracking-wide opacity-80 font-semibold text-6xl bg-gradient-to-r from-green-400 via-teal-500 to-indigo-400 inline-block text-transparent bg-clip-text animate-fade-right animate-once animate-ease-out">
                                Hello, {user.name.split(" ")[0]}
                            </h1>
                            <h1 className="mt-4 tracking-wide opacity-80 text-5xl bg-gradient-to-r from-gray-400 via-gray-300 to-gray-300 inline-block text-transparent bg-clip-text animate-fade-right animate-once animate-ease-out animate-delay-500">
                                How can I Help You today?
                            </h1>
                        </div>
                        {/* Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                            <div className="flex flex-col justify-between rounded rounded-lg border p-4 relative animate-once animate-fade-up animate-ease-out animate-delay-100">
                                <span className="text-gray-500 mb-16">
                                    Detect diseases in my maize plant
                                </span>
                                <div className="p-2 rounded rounded-full bg-green-100 w-fit absolute bottom-4 right-4">
                                    <FaSeedling className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                            <div className="flex flex-col justify-between rounded rounded-lg border p-4 relative animate-once animate-fade-up animate-ease-out animate-delay-300">
                                <span className="text-gray-500 mb-16">
                                    Find Treatment Recommendation Youtube Videos
                                </span>
                                <div className="p-2 rounded rounded-full bg-red-100 w-fit absolute bottom-4 right-4">
                                    <FaYoutube className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            <div className="flex flex-col justify-between rounded rounded-lg border p-4 relative animate-once animate-fade-up animate-ease-out animate-delay-[600ms]">
                                <span className="text-gray-500 mb-16">
                                    Detail diagnosis of maize diseases
                                </span>
                                <div className="p-2 rounded rounded-full bg-teal-100 w-fit absolute bottom-4 right-4">
                                    <MdOutlinePhotoCamera className="w-6 h-6 text-teal-500" />
                                </div>
                            </div>
                            <div className="flex flex-col justify-between rounded rounded-lg border p-4 relative animate-once animate-fade-up animate-ease-out animate-delay-[900ms]">
                                <span className="text-gray-500 mb-16">
                                    Provide recommendation action for treatment
                                </span>
                                <div className="p-2 rounded rounded-full bg-purple-100 w-fit absolute bottom-4 right-4">
                                    <FaListUl className="w-6 h-6 text-purple-500" />
                                </div>
                            </div>
                        </div>
                    </>
                    
                ) : (
                    <>
                        {chatHistory.map((chat, idx) => (
                        <div key={idx}>
                            {chat.user ? (
                                <div className="flex flex-row gap-4" key={idx}>
                                    <img 
                                    className="w-8 h-8 rounded rounded-lg"
                                    referrerPolicy="no-referrer" src={`${user.profile_pict}?${Date.now()}`} />
                                    <div className="flex-1 bg-gray-50 p-5 rounded rounded-xl">
                                        <div className="flex flex-col items-start gap-4">
                                            <span className="text-gray-700">
                                                {chat.chat}
                                            </span>
                                            {chat.image && 
                                            <Avatar size="xl" img={URL.createObjectURL(chat.image)} />
                                            }
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-row gap-4" key={idx}>
                                    <PiStarFourFill className="w-8 h-8 text-green-400" />
                                    {generating && chat?.chat === undefined ? (
                                        <div className="flex-1 space-y-3 animate-pulse">
                                            <div className="h-3 bg-green-200 rounded w-full"></div>
                                            <div className="h-3 bg-green-200 rounded w-11/12"></div>
                                            <div className="h-3 bg-green-200 rounded w-4/5"></div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 bg-gray-50 p-5 rounded rounded-xl">
                                            <div className="flex flex-col items-start gap-4">
                                                {chat?.chat?.disease_detected  &&
                                                ( 
                                                <h3 className="text-lg font-bold">
                                                    {chat?.chat?.disease_name}
                                                    </h3> 
                                                    )
                                                }
                                                <span className="text-gray-700">
                                                        <ReactMarkdown className="mb-2">
                                                            {chat?.chat?.description}
                                                        </ReactMarkdown>
                                                        <ReactMarkdown>
                                                            {chat?.chat?.additional_notes}
                                                        </ReactMarkdown>
                                                </span>
                                                {chat?.chat?.symptoms?.length > 0 && 
                                                    (
                                                        <>
                                                        <h2 className="font-bold">Symptoms:</h2>
                                                        <ul className="list-disc pl-5">
                                                            {chat.chat.symptoms.map((symptom, idx) => (
                                                                <li className="text-gray-700" key={idx}>{symptom}</li>
                                                            ))}
                                                        </ul>
                                                        </>
                                                    )
                                                }
                                                {chat?.chat?.recommended_actions?.length > 0 && 
                                                    (
                                                        <>
                                                        <h2 className="font-bold">Recommended Action:</h2>
                                                            <ul className="list-disc pl-5">
                                                            {chat.chat.recommended_actions.map((action, idx) => (
                                                                <li className="text-gray-700" key={idx}>{action}</li>
                                                            ))}
                                                            </ul>
                                                        </>
                                                    )
                                                }
                                                {youtubeLinks[(idx-1)/2]?.length > 0 && 
                                                (
                                                    <div className="flex flex-row gap-4 flex-wrap">
                                                        {youtubeLinks[(idx-1)/2].map((link, index) => (
                                                            <YouTubeCard key={index} link={link} />
                                                        ))}
                                                    </div>
                                                )
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    </>
                )}
                
            </div>
            {user.role === 'regular' &&
            (
            <div className="w-full text-end">
                <span className="text-gray-400 text-sm">Quota: {quota !== null ? `${quota} / 5` : ''}</span>
            </div>
            )
            }
            
            {/* Input */}
            <div className={`flex flex-row gap-2 justify-between ${file === null ? 'items-center' : 'items-end'} bg-gray-100 w-full mb-6 p-3 rounded rounded-xl border border-gray-200`}>
                <input 
                    type='file' 
                    ref={fileInputRef}
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setFile(file);
                        }
                    }}
                />
                <button 
                onClick={() => {fileInputRef.current.click()}}
                className='p-1.5 hover:bg-gray-200 rounded rounded-xl'>
                    <IoMdAttach className='w-5 h-5 text-gray-600' />
                </button>
                <div className={`flex flex-col w-full items-start`}>
                    {file && (
                        <div className="relative">
                            <Avatar img={URL.createObjectURL(file)} />
                            <button 
                                className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full p-0.5"
                                onClick={() => setFile(null)}
                            >
                                <IoMdClose className="w-3 h-3" />
                            </button>
                        </div>
                        )}
                    <div className='relative w-full'>
                        <div
                        ref={textRef}
                        contentEditable={!(user.role === 'regular' && quota >= 5)}
                        className='w-full max-h-[200px] overflow-y-auto focus:outline-none text-gray-700'
                        onInput={(e) => {setInput(e.target.textContent)}} 
                        />
                        {input === '' && !(user.role === 'regular' && quota >= 5) && (
                            <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
                                Your maize disease concern...
                            </div>
                        )}
                        {user.role === 'regular' && quota >= 5 && (
                            <div className="text-gray-400 pointer-events-none">
                                Your quota is full
                            </div>
                        )}
                    </div>
                </div>
                
                <button
                disabled={input === '' || generating}
                onClick={handleSendMessage}
                className={`p-2 rounded rounded-lg ${
                    input === '' || generating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-400 hover:bg-green-500'
                }`}>
                    <FaLocationArrow className='text-white w-4 h-4' />
                </button>
            </div>
        </div>
    );
}

export default ChatPage;
