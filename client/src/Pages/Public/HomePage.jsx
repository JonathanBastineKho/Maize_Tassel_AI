import React from "react";
import { Button, Timeline, Card, Footer } from "flowbite-react";
import CountUp from 'react-countup';
import Spline from "@splinetool/react-spline";
import { useInView } from "react-intersection-observer";
import { FaArrowRight, FaCheck, FaChartLine, FaClock, FaLock, FaChartPie, FaCogs, FaDatabase, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function HomePage() {

    const { ref: countUpRef, inView: countUpVisible } = useInView({
        triggerOnce: false,
        threshold: 0.2,
        });
    const { ref: timelineRef, inView: timelineVisible } = useInView({
        triggerOnce: false,
        threshold: 0.2,
        });
    const { ref: titleRef, inView: titleVisible } = useInView({
            triggerOnce: false,
            threshold: 0.2,
    });
    const navigate = useNavigate();

  return (
    <div className="mt-20">
      <section className="py-10" id="home">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2">
            <h1 className="text-6xl font-bold mb-4">
                Welcome to <span ref={titleRef} className={`transition-opacity duration-1000 ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>CornSight</span>
                {/* <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">CornSight</span> */}
            </h1>
              <p className="text-xl mb-8 text-gray-600">
                Revolutionizing Maize Tassel Counting with AI
              </p>
              <div className="flex">
                <Button
                  size="lg"
                  className="rounded-2xl bg-gradient-to-r from-green-400 to-cyan-600 text-white font-semibold shadow-md hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-800 ease-in-out mr-4"
                  onClick={() => {navigate("/user/dashboard")}}
                >
                    <div className="flex flex-row justify-between items-center gap-4">
                        <div>
                            <span>Start Counting Now for Free</span>
                        </div>
                        <FaArrowRight className="w-5 h-5" />
                    </div>
                    
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              {/* Replace this div with your 3D model animation */}
              <div className="bg-white rounded-lg h-full">
                <Spline
                  className="h-full w-full z-[-10]"
                  scene="https://prod.spline.design/2QB7YpyFh2xRz0-g/scene.splinecode"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Random green illustrations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="z-[-1] absolute top-32 -left-10 w-40 h-40 bg-green-200 rounded-full filter blur-xl opacity-70 transform rotate-45"></div>
          <div className="absolute top-28 right-10 w-20 h-28 bg-green-300 rounded-full filter blur-xl opacity-70"></div>
          <div className="absolute bottom-80 right-24 w-[36rem] h-48 bg-green-100 rounded-full filter blur-xl opacity-70 transform -rotate-12"></div>
          <div className="absolute bottom-10 right-20 w-30 h-30 bg-green-200 rounded-full filter blur-xl opacity-70 transform rotate-12"></div>
        </div>
      </section>

      <section id="features" className="py-16 px-8" ref={countUpRef}>
      <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="max-w-screen-md mb-8 lg:mb-16">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Why Choose CornSight?
            </h2>
            <p className="text-gray-500 sm:text-xl dark:text-gray-400">
              CornSight offers cutting-edge technology and features to revolutionize maize tassel counting.
            </p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-16 md:space-y-0">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-green-100 lg:h-16 lg:w-16 dark:bg-green-900 mr-4">
                  <FaChartLine className="w-6 h-6 text-green-600 lg:w-8 lg:h-8 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold dark:text-white">
                  {countUpVisible ? <CountUp end={90} duration={5} /> : 0}%
                    </h3>
                  <p className="text-gray-500 dark:text-gray-400">mAP Accuracy</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Ensuring precise tassel counting results with 5.87 MAE.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-blue-100 lg:h-16 lg:w-16 dark:bg-blue-900 mr-4">
                  <FaClock className="w-6 h-6 text-blue-600 lg:w-8 lg:h-8 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold dark:text-white">&lt;{countUpVisible ? <CountUp end={1} duration={5} decimals={1} /> : 0}s</h3>
                  <p className="text-gray-500 dark:text-gray-400">Processing Time</p>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Providing quick and efficient results with up to less than 1 second of processing time.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-purple-100 lg:h-16 lg:w-16 dark:bg-purple-900 mr-4">
                  <FaLock className="w-6 h-6 text-purple-600 lg:w-8 lg:h-8 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold dark:text-white">Secure</h3>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                CornSight ensures the security of your data with advanced encryption and secure storage. Your information is protected at every step.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-yellow-100 lg:h-16 lg:w-16 dark:bg-yellow-900 mr-4">
                  <FaChartPie className="w-6 h-6 text-yellow-600 lg:w-8 lg:h-8 dark:text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold dark:text-white">Comprehensive Analysis</h3>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Get detailed insights and comprehensive analysis on tassel count, enabling data-driven decision making.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-red-100 lg:h-16 lg:w-16 dark:bg-red-900 mr-4">
                  <FaCogs className="w-6 h-6 text-red-600 lg:w-8 lg:h-8 dark:text-red-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold dark:text-white">Continuous Improvement</h3>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                CornSight continuously improves its algorithms to enhance robustness to different situations, ensuring reliable results in various scenarios.
              </p>
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-orange-100 lg:h-16 lg:w-16 dark:bg-orange-900 mr-4">
                  <FaDatabase className="w-6 h-6 text-orange-600 lg:w-8 lg:h-8 dark:text-orange-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold dark:text-white">Storage Management</h3>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Efficiently manage and store enormous tassel images, ensuring easy access and organization for users.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="getting-started" className="py-16 bg-gray-50">
      <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 px-32">
                <video
                className="w-full h-auto rounded-2xl shadow-xl"
                src="https://storage.googleapis.com/corn_sight_public/Product%20Demo.mp4"
                autoPlay
                loop
                muted
                playsInline
            ></video>
            </div>
            <div className="md:w-1/2">
              <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
                Getting Started
              </h2>
              <p className="text-gray-500 sm:text-xl dark:text-gray-400 mb-8">
                Follow these simple steps to start using CornSight and revolutionize your tassel counting process.
              </p>
              <div className={`transition-opacity duration-700 ${timelineVisible ? 'opacity-100' : 'opacity-0'}`} ref={timelineRef}>
                <Timeline>
                    <Timeline.Item>
                    <Timeline.Point />
                    <Timeline.Content>
                        <Timeline.Time>Step 1</Timeline.Time>
                        <Timeline.Title>Upload Images</Timeline.Title>
                        <Timeline.Body>
                        Upload your maize tassel images to the CornSight platform. You can select multiple images at once for batch processing.
                        </Timeline.Body>
                    </Timeline.Content>
                    </Timeline.Item>
                    <Timeline.Item>
                    <Timeline.Point />
                    <Timeline.Content>
                        <Timeline.Time>Step 2</Timeline.Time>
                        <Timeline.Title>Automatic Counting</Timeline.Title>
                        <Timeline.Body>
                        Our advanced AI algorithm will automatically analyze the uploaded images and accurately count the number of tassels in each image.
                        </Timeline.Body>
                    </Timeline.Content>
                    </Timeline.Item>
                    <Timeline.Item>
                    <Timeline.Point />
                    <Timeline.Content>
                        <Timeline.Time>Step 3</Timeline.Time>
                        <Timeline.Title>Visualization and Analysis</Timeline.Title>
                        <Timeline.Body>
                        View the tassel count results for each image. Gain insights through comprehensive analysis and visualizations to make data-driven decisions.
                        </Timeline.Body>
                    </Timeline.Content>
                    </Timeline.Item>
                </Timeline>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
              Choose the Right Plan for You
            </h2>
            <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
              Select a pricing plan that fits your needs and unlock the full potential of CornSight.
            </p>
          </div>
          <div className="space-y-8 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-10 lg:space-y-0">
            {/* Free Tier */}
            <Card>
              <h3 className="mb-4 text-2xl font-semibold">Free</h3>
              <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                Get started with basic features and limited storage.
              </p>
              <div className="flex justify-center items-baseline my-8">
                <span className="mr-2 text-5xl font-extrabold">$0</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>100 images of storage</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaTimes className="flex-shrink-0 w-5 h-5 text-red-500 dark:text-red-400" />
                  <span>Priority processing</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaTimes className="flex-shrink-0 w-5 h-5 text-red-500 dark:text-red-400" />
                  <span>Bulk upload</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaTimes className="flex-shrink-0 w-5 h-5 text-red-500 dark:text-red-400" />
                  <span>Unlimited historical data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaTimes className="flex-shrink-0 w-5 h-5 text-red-500 dark:text-red-400" />
                  <span>Tassel count forecast</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaTimes className="flex-shrink-0 w-5 h-5 text-red-500 dark:text-red-400" />
                  <span>Folder management system</span>
                </li>
              </ul>
              <Button className="w-full" color="gray">
                Get started
              </Button>
            </Card>
            {/* Premium Monthly */}
            <Card>
              <h3 className="mb-4 text-2xl font-semibold">Premium Monthly</h3>
              <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                Unlock advanced features and unlimited storage on a monthly basis.
              </p>
              <div className="flex justify-center items-baseline my-8">
                <span className="mr-2 text-5xl font-extrabold">$20</span>
                <span className="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Unlimited storage</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Priority processing</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Bulk upload</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Unlimited historical data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Tassel count forecast</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Folder management system</span>
                </li>
              </ul>
              <Button className="w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">
                Get started
              </Button>
            </Card>
            {/* Premium Yearly */}
            <Card>
              <h3 className="mb-4 text-2xl font-semibold">Premium Yearly</h3>
              <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                Save with an annual subscription and enjoy all premium features.
              </p>
              <div className="flex justify-center items-baseline my-8">
                <span className="mr-2 text-5xl font-extrabold">$150</span>
                <span className="text-gray-500 dark:text-gray-400">/year</span>
              </div>
              <ul className="mb-8 space-y-4 text-left">
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Unlimited storage</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Priority processing</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Bulk upload</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Unlimited historical data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Tassel count forecast</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaCheck className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
                  <span>Folder management system</span>
                </li>
              </ul>
              <Button className="w-full bg-green-500 focus:ring-4 focus:ring-green-300 enabled:hover:bg-green-600">
                Get started
              </Button>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer container={true} className="">
        <div className="w-full text-center">
          <div className="w-full justify-between sm:flex sm:items-center sm:justify-between">
            <Footer.Brand
              href="/"
              src="https://storage.googleapis.com/corn_sight_public/apple-touch-icon.png"
              alt="CornSight Logo"
              name="CornSight"
            />
            <Footer.LinkGroup>
              <Footer.Link href="#">About</Footer.Link>
              <Footer.Link href="#">Privacy Policy</Footer.Link>
              <Footer.Link href="#">Terms & Conditions</Footer.Link>
              <Footer.Link href="#">Contact</Footer.Link>
            </Footer.LinkGroup>
          </div>
          <Footer.Divider />
          <Footer.Copyright href="#" by="CornSight™" year={2024} />
        </div>
      </Footer>
    </div>
  );
}

export default HomePage;
