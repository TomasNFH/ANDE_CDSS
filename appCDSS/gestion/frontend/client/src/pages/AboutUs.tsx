import React from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSidebar } from "@/contexts/SidebarContext";

const people = [
  {
    role: "Author",
    name: "Tomás Ferraz",
    image: "/TomasFerraz.jpg",
    description: "Tomás is the main developer and researcher behind DynamicDSS, passionate about AI in healthcare.",
    career: "PhD Student in Biomedical Engineering",
    email: "tomas.ferraz@email.com",
  },
  {
    role: "Tutor",
    name: "Dr. Parag Chaterjje",
    image: "/ParagChaterjje.jpeg",
    description: "Dr. Chaterjje provided expert guidance in clinical decision support systems and supervised the project.",
    career: "MSc. Computer Science, PhD. Informática",
    email: "paragc@ieee.org",
  },
  {
    role: "Co-Tutor",
    name: "Dr. Mario Gonazlez",
    image: "/MarioGonazlez.jpg",
    description: "Dr. Gonazalez contributed with his expertise in machine learning and project methodology.",
    career: "Associate Professor, Machine Learning Specialist",
    email: "mago876@gmail.com",
  },
];

const AboutUs = () => {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <DashboardHeader />
        <main className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
          <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
          <div className="flex flex-wrap justify-center gap-12">
            {people.map((person) => (
              <div key={person.role} className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center w-72">
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-blue-300"
                />
                <h2 className="text-xl font-semibold mb-1">{person.name}</h2>
                <span className="text-blue-600 font-medium mb-2">{person.role}</span>
                <span className="text-gray-700 textcenter text-sm mb-1">{person.career}</span>
                <p className="text-gray-600 text-center text-sm">{person.description}</p>
                <a href={`mailto:${person.email}`} className="text-blue-500 text-xs mb-2 hover:underline">{person.email}</a>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AboutUs;
