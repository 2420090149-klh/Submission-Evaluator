import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const generateDemoEvent = async (hostId) => {
  try {
    // 1. Create a Demo Event
    const eventDocRef = await addDoc(collection(db, 'events'), {
      title: "🚀 Demo Event: Innovation 2026",
      hostId: hostId,
      createdAt: serverTimestamp(),
      status: 'collecting' // We'll set to collecting initially so they can test voting phase
    });

    const eventId = eventDocRef.id;

    // 2. Create Mock Submissions
    const submissions = [
      {
        participantName: "Alex Rivera",
        email: "alex@example.com",
        phone: "+1 (555) 123-4567",
        description: "A revolutionary new design for sustainable urban transport using magnetic levitation.",
        fileUrl: "https://images.unsplash.com/photo-1558522195-e1201b090344?q=80&w=2070&auto=format&fit=crop",
        fileType: "image/jpeg"
      },
      {
        participantName: "Sarah Chen",
        email: "sarah@example.com",
        phone: "+1 (555) 987-6543",
        description: "An AI-powered smart home assistant that reduces energy consumption by 40%.",
        fileUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
        fileType: "image/jpeg"
      },
      {
        participantName: "Marcus Johnson",
        email: "marcus@example.com",
        phone: "+1 (555) 555-0199",
        description: "Next-generation wearable health monitor for early disease detection.",
        fileUrl: "https://images.unsplash.com/photo-1576670158481-c67b25539f4f?q=80&w=2069&auto=format&fit=crop",
        fileType: "image/jpeg"
      }
    ];

    const submissionIds = [];
    for (const sub of submissions) {
      const docRef = await addDoc(collection(db, 'submissions'), {
        eventId,
        ...sub,
        createdAt: serverTimestamp()
      });
      submissionIds.push(docRef.id);
    }

    // 3. Create Mock Votes
    const mockVoters = ['voter_demo_1', 'voter_demo_2', 'voter_demo_3'];
    for (const voterId of mockVoters) {
      for (const subId of submissionIds) {
        // Random score between 5 and 10
        const score = Math.floor(Math.random() * 6) + 5;
        await addDoc(collection(db, 'votes'), {
          eventId,
          submissionId: subId,
          score,
          voterId,
          createdAt: serverTimestamp()
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error generating demo event:", error);
    return false;
  }
};
