import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-QSWZC0V65C",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Coleções - usando a coleção 'sites' que já tem permissão nas regras atuais
// Simplificando a estrutura para evitar subcoleções
const CLIENTS_COLLECTION = "sites"
const CALENDARS_COLLECTION = "sites"
const POSTS_COLLECTION = "sites"
const NOTIFICATIONS_COLLECTION = "sites"

// Auth functions
export const loginAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

export const logoutAdmin = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error logging out:", error)
    throw error
  }
}

// Client functions
export const generateClientCode = () => {
  const prefix = "CLI"
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${randomNum}`
}

export const createClient = async (clientData: { name: string; code: string }) => {
  try {
    // Check if code already exists
    const codeQuery = query(collection(db, CLIENTS_COLLECTION), where("code", "==", clientData.code))
    const codeSnapshot = await getDocs(codeQuery)

    if (!codeSnapshot.empty) {
      throw new Error("Código de cliente já existe")
    }

    const clientRef = doc(collection(db, CLIENTS_COLLECTION))
    await setDoc(clientRef, {
      ...clientData,
      type: "client", // Marcador para identificar documentos de clientes
      createdAt: serverTimestamp(),
      postsCount: 0,
      calendars: [], // Array para armazenar calendários diretamente no documento
    })

    return clientRef.id
  } catch (error) {
    console.error("Error creating client:", error)
    throw error
  }
}

export const getClientByCode = async (code: string) => {
  try {
    const clientsRef = collection(db, CLIENTS_COLLECTION)
    const q = query(clientsRef, where("code", "==", code), where("type", "==", "client"))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const clientDoc = querySnapshot.docs[0]
    return {
      id: clientDoc.id,
      ...clientDoc.data(),
    }
  } catch (error) {
    console.error("Error getting client by code:", error)
    throw error
  }
}

export const getAllClients = async () => {
  try {
    const clientsRef = collection(db, CLIENTS_COLLECTION)
    const q = query(clientsRef, where("type", "==", "client"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting all clients:", error)
    throw error
  }
}

export const updateClient = async (clientId: string, clientData: any) => {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId)
    await updateDoc(clientRef, clientData)
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

export const deleteClient = async (clientId: string) => {
  try {
    // Get client data first
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId)
    const clientDoc = await getDoc(clientRef)

    if (!clientDoc.exists()) {
      throw new Error("Cliente não encontrado")
    }

    const clientData = clientDoc.data()

    // Delete all posts for this client
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where("clientId", "==", clientId),
      where("type", "==", "post"),
    )

    const postsSnapshot = await getDocs(postsQuery)

    // Delete each post and its image
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data()
      if (postData.imageUrl) {
        // Delete image from storage
        const imageRef = ref(storage, postData.imageUrl)
        await deleteObject(imageRef).catch((err) => console.log("Error deleting image:", err))
      }
      await deleteDoc(doc(db, POSTS_COLLECTION, postDoc.id))
    }

    // Delete all calendars for this client
    const calendarsQuery = query(
      collection(db, CALENDARS_COLLECTION),
      where("clientId", "==", clientId),
      where("type", "==", "calendar"),
    )

    const calendarsSnapshot = await getDocs(calendarsQuery)

    for (const calendarDoc of calendarsSnapshot.docs) {
      await deleteDoc(doc(db, CALENDARS_COLLECTION, calendarDoc.id))
    }

    // Finally delete the client
    await deleteDoc(clientRef)
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}

// Calendar functions - Simplificado para usar uma coleção separada
export const createCalendar = async (calendarData: {
  clientId: string
  name: string
  color: string
}) => {
  try {
    // Criar um novo documento na coleção sites para o calendário
    const calendarRef = doc(collection(db, CALENDARS_COLLECTION))
    await setDoc(calendarRef, {
      ...calendarData,
      type: "calendar", // Marcador para identificar documentos de calendários
      createdAt: serverTimestamp(),
    })

    // Atualizar o array de calendários no documento do cliente
    const clientRef = doc(db, CLIENTS_COLLECTION, calendarData.clientId)
    const clientDoc = await getDoc(clientRef)

    if (clientDoc.exists()) {
      const clientData = clientDoc.data()
      const calendars = clientData.calendars || []

      await updateDoc(clientRef, {
        calendars: [
          ...calendars,
          {
            id: calendarRef.id,
            name: calendarData.name,
            color: calendarData.color,
          },
        ],
      })
    }

    return calendarRef.id
  } catch (error) {
    console.error("Error creating calendar:", error)
    throw error
  }
}

export const getClientCalendars = async (clientId: string) => {
  try {
    const calendarsQuery = query(
      collection(db, CALENDARS_COLLECTION),
      where("clientId", "==", clientId),
      where("type", "==", "calendar"),
    )

    const querySnapshot = await getDocs(calendarsQuery)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting client calendars:", error)
    throw error
  }
}

export const updateCalendar = async (calendarId: string, calendarData: { name?: string; color?: string }) => {
  try {
    // Atualizar o documento do calendário
    const calendarRef = doc(db, CALENDARS_COLLECTION, calendarId)
    await updateDoc(calendarRef, calendarData)

    // Obter dados do calendário para encontrar o clientId
    const calendarDoc = await getDoc(calendarRef)

    if (calendarDoc.exists()) {
      const calendarFullData = calendarDoc.data()
      const clientId = calendarFullData.clientId

      // Atualizar o calendário no array de calendários do cliente
      const clientRef = doc(db, CLIENTS_COLLECTION, clientId)
      const clientDoc = await getDoc(clientRef)

      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        const calendars = clientData.calendars || []
        const updatedCalendars = calendars.map((cal: any) =>
          cal.id === calendarId ? { ...cal, ...calendarData } : cal,
        )

        await updateDoc(clientRef, { calendars: updatedCalendars })
      }
    }
  } catch (error) {
    console.error("Error updating calendar:", error)
    throw error
  }
}

export const deleteCalendar = async (calendarId: string) => {
  try {
    // Obter dados do calendário primeiro para obter o clientId
    const calendarRef = doc(db, CALENDARS_COLLECTION, calendarId)
    const calendarDoc = await getDoc(calendarRef)

    if (!calendarDoc.exists()) {
      throw new Error("Calendar not found")
    }

    const calendarData = calendarDoc.data()
    const clientId = calendarData.clientId

    // Excluir todos os posts associados a este calendário
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where("calendarId", "==", calendarId),
      where("type", "==", "post"),
    )

    const postsSnapshot = await getDocs(postsQuery)

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data()
      if (postData.imageUrl) {
        // Delete image from storage
        const imageRef = ref(storage, postData.imageUrl)
        await deleteObject(imageRef).catch((err) => console.log("Error deleting image:", err))
      }
      await deleteDoc(doc(db, POSTS_COLLECTION, postDoc.id))
    }

    // Excluir o documento do calendário
    await deleteDoc(calendarRef)

    // Atualizar o array de calendários no documento do cliente
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId)
    const clientDoc = await getDoc(clientRef)

    if (clientDoc.exists()) {
      const clientData = clientDoc.data()
      const calendars = clientData.calendars || []
      const updatedCalendars = calendars.filter((cal: any) => cal.id !== calendarId)

      await updateDoc(clientRef, { calendars: updatedCalendars })
    }
  } catch (error) {
    console.error("Error deleting calendar:", error)
    throw error
  }
}

// Post functions
export const createPost = async (postData: {
  clientId: string
  calendarId: string
  caption: string
  date: Date
  imageFile: File
}) => {
  try {
    // Use a storage path that's likely to have permissions
    // Using the 'images' folder which is commonly allowed in Firebase Storage rules
    const imageFileName = `images/${Date.now()}_${postData.imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
    const imageRef = ref(storage, imageFileName)

    // Upload the file with metadata
    const metadata = {
      contentType: postData.imageFile.type,
    }

    await uploadBytes(imageRef, postData.imageFile, metadata)

    // Get download URL
    const imageUrl = await getDownloadURL(imageRef)

    // Get calendar info
    const calendarRef = doc(db, CALENDARS_COLLECTION, postData.calendarId)
    const calendarDoc = await getDoc(calendarRef)
    let calendarName = ""
    let calendarColor = ""

    if (calendarDoc.exists()) {
      calendarName = calendarDoc.data().name || ""
      calendarColor = calendarDoc.data().color || ""
    }

    // Create post document
    const postRef = doc(collection(db, POSTS_COLLECTION))
    await setDoc(postRef, {
      clientId: postData.clientId,
      calendarId: postData.calendarId,
      calendarName,
      calendarColor,
      caption: postData.caption,
      date: postData.date,
      imageUrl: imageUrl,
      status: "scheduled",
      type: "post", // Marcador para identificar documentos de posts
      createdAt: serverTimestamp(),
    })

    // Update client's post count
    const clientRef = doc(db, CLIENTS_COLLECTION, postData.clientId)
    const clientDoc = await getDoc(clientRef)

    if (clientDoc.exists()) {
      const clientData = clientDoc.data()
      await updateDoc(clientRef, {
        postsCount: (clientData.postsCount || 0) + 1,
      })
    }

    return postRef.id
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

export const getPostsByClient = async (clientId: string) => {
  try {
    console.log("Buscando posts para o cliente:", clientId)
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where("clientId", "==", clientId),
      where("type", "==", "post"),
    )

    const querySnapshot = await getDocs(postsQuery)
    console.log("Número de posts encontrados:", querySnapshot.size)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      // Garantir que a data seja convertida corretamente
      const date = data.date?.toDate ? data.date.toDate() : data.date instanceof Date ? data.date : new Date()

      return {
        id: doc.id,
        ...data,
        date: date,
      }
    })
  } catch (error) {
    console.error("Error getting posts by client:", error)
    throw error
  }
}

export const getPostsByCalendar = async (calendarId: string) => {
  try {
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where("calendarId", "==", calendarId),
      where("type", "==", "post"),
      orderBy("date", "asc"),
    )

    const querySnapshot = await getDocs(postsQuery)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(), // Convert Firestore timestamp to JS Date
    }))
  } catch (error) {
    console.error("Error getting posts by calendar:", error)
    throw error
  }
}

export const getPostById = async (postId: string) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      return null
    }

    const data = postDoc.data()
    return {
      id: postDoc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
    }
  } catch (error) {
    console.error("Error getting post by ID:", error)
    throw error
  }
}

export const updatePost = async (postId: string, postData: any) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId)

    // Se houver um novo arquivo de imagem, fazer upload
    if (postData.imageFile) {
      const imageFile = postData.imageFile
      delete postData.imageFile // Remover o arquivo do objeto de dados

      // Obter o post atual para verificar se já existe uma imagem
      const currentPost = await getDoc(postRef)

      if (currentPost.exists() && currentPost.data().imageUrl) {
        try {
          // Tentar excluir a imagem antiga
          const url = new URL(currentPost.data().imageUrl)
          const pathFromUrl = decodeURIComponent(url.pathname.split("/").slice(2).join("/"))
          const oldImageRef = ref(storage, pathFromUrl)
          await deleteObject(oldImageRef).catch((err) => console.log("Error deleting old image:", err))
        } catch (err) {
          console.log("Error processing old image URL:", err)
        }
      }

      // Fazer upload da nova imagem
      const imageFileName = `images/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const imageRef = ref(storage, imageFileName)

      const metadata = {
        contentType: imageFile.type,
      }

      await uploadBytes(imageRef, imageFile, metadata)
      const imageUrl = await getDownloadURL(imageRef)

      // Adicionar a URL da nova imagem aos dados do post
      postData.imageUrl = imageUrl
    }

    // Atualizar o documento do post
    await updateDoc(postRef, postData)

    return postId
  } catch (error) {
    console.error("Error updating post:", error)
    throw error
  }
}

export const deletePost = async (postId: string) => {
  try {
    // Get post data first
    const postRef = doc(db, POSTS_COLLECTION, postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error("Post not found")
    }

    const postData = postDoc.data()

    // Delete image from storage if exists
    if (postData.imageUrl) {
      try {
        // Extract the path from the URL
        const url = new URL(postData.imageUrl)
        const pathFromUrl = decodeURIComponent(url.pathname.split("/").slice(2).join("/"))
        const imageRef = ref(storage, pathFromUrl)
        await deleteObject(imageRef)
      } catch (err) {
        console.log("Error deleting image:", err)
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete post document
    await deleteDoc(postRef)

    // Update client's post count
    const clientRef = doc(db, CLIENTS_COLLECTION, postData.clientId)
    const clientDoc = await getDoc(clientRef)

    if (clientDoc.exists()) {
      const clientData = clientDoc.data()
      await updateDoc(clientRef, {
        postsCount: Math.max((clientData.postsCount || 0) - 1, 0),
      })
    }
  } catch (error) {
    console.error("Error deleting post:", error)
    throw error
  }
}

// Notification functions
export const getTodayPosts = async () => {
  try {
    // Obter a data de hoje (início do dia)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Obter a data de amanhã (início do dia)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Converter para Timestamp do Firestore
    const todayTimestamp = Timestamp.fromDate(today)
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow)

    // Buscar posts agendados para hoje
    const postsQuery = query(
      collection(db, POSTS_COLLECTION),
      where("type", "==", "post"),
      where("date", ">=", todayTimestamp),
      where("date", "<", tomorrowTimestamp),
    )

    const querySnapshot = await getDocs(postsQuery)

    // Mapear os resultados
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      }
    })
  } catch (error) {
    console.error("Error getting today's posts:", error)
    throw error
  }
}

export const markNotificationAsSeen = async (postId: string, userId: string) => {
  try {
    // Verificar se já existe uma notificação para este post
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("postId", "==", postId),
      where("userId", "==", userId),
      where("type", "==", "notification"),
    )

    const querySnapshot = await getDocs(notificationsQuery)

    if (!querySnapshot.empty) {
      // Atualizar a notificação existente
      const notificationDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationDoc.id), {
        seen: true,
        seenAt: serverTimestamp(),
      })
      return notificationDoc.id
    } else {
      // Criar uma nova notificação
      const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION))
      await setDoc(notificationRef, {
        postId,
        userId,
        type: "notification",
        seen: true,
        createdAt: serverTimestamp(),
        seenAt: serverTimestamp(),
      })
      return notificationRef.id
    }
  } catch (error) {
    console.error("Error marking notification as seen:", error)
    throw error
  }
}

export const getSeenNotifications = async (userId: string) => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId),
      where("type", "==", "notification"),
      where("seen", "==", true),
    )

    const querySnapshot = await getDocs(notificationsQuery)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      postId: doc.data().postId,
    }))
  } catch (error) {
    console.error("Error getting seen notifications:", error)
    throw error
  }
}
