import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Folder, Note, QuizQuestion, QuizResult, Category, Entry, EntryType, QuestionDifficulty } from '@/types/models';
import { calculateNextReview } from '@/services/spacedRepetitionService';
import { supabase } from '@/lib/supabaseClient';

interface AppContextType {
	// Legacy folder/note system
	folders: Folder[];
	currentFolder: Folder | null;
	currentNote: Note | null;
	currentQuiz: QuizQuestion[] | null;
	quizQuestions: QuizQuestion[];
	quizResults: QuizResult[];
	isLoadingData: boolean;
	loadingProgress: number;

	createFolder: (name: string, description?: string) => Promise<Folder | null>;
	getFolder: (id: string) => Folder | undefined;
	updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
	deleteFolder: (id: string) => Promise<void>;
	setCurrentFolder: (folder: Folder | null) => void;

	createNote: (folderId: string, title: string, content: string) => Promise<Note | null>;
	getNote: (folderId: string, noteId: string) => Note | undefined;
	updateNote: (folderId: string, noteId: string, data: Partial<Note>) => Promise<boolean>;
	deleteNote: (folderId: string, noteId: string) => Promise<void>;
	setCurrentNote: (note: Note | null) => void;

	generateQuiz: (folderId: string, selectedNoteIds?: string[]) => Promise<QuizQuestion[]>;
	generateMultipleChoiceQuiz: (folderId: string, selectedNoteIds?: string[]) => Promise<QuizQuestion[]>;
	saveQuizResult: (result: Omit<QuizResult, 'id' | 'user_id'>) => Promise<void>;
	updateQuestionSpacedRepetitionData: (folderId: string, questionId: string, correct: boolean) => Promise<void>;
	isGeneratingQuiz: boolean;

	// Quiz management functions
	getFolderQuestions: (folderId: string) => QuizQuestion[];
	updateQuestion: (questionId: string, data: Partial<QuizQuestion>) => Promise<void>;
	createQuestion: (folderId: string, data: QuizQuestion) => Promise<void>;
	deleteQuestion: (questionId: string) => void;

	// New category/entry system
	categories: Category[];
	entries: Entry[];
	currentCategory: Category | null;
	currentEntry: Entry | null;

	createCategory: (name: string, type: EntryType, description?: string) => Promise<Category | null>;
	getCategory: (id: string) => Category | undefined;
	updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
	deleteCategory: (id: string) => Promise<void>;
	setCurrentCategory: (category: Category | null) => void;

	createEntry: (categoryId: string, title: string, content: string, type: EntryType) => Promise<Entry | null>;
	getEntry: (categoryId: string, entryId: string) => Entry | undefined;
	updateEntry: (categoryId: string, entryId: string, data: Partial<Entry>) => Promise<void>;
	deleteEntry: (categoryId: string, entryId: string) => Promise<void>;
	setCurrentEntry: (entry: Entry | null) => void;

	getQuizes: (folderId: string) => QuizQuestion[];
	getQuizResults: (folderId: string) => Promise<QuizResult[]>;
	cleanupOrphanedQuizResults: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [folders, setFolders] = useState<Folder[]>([]);
	const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
	const [currentNote, setCurrentNote] = useState<Note | null>(null);
	const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
	const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
	const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
	const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [loadingProgress, setLoadingProgress] = useState(0);

	// New category/entry state
	const [categories, setCategories] = useState<Category[]>([]);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
	const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);

	const { toast } = useToast();

	// Mock user ID for local storage
	const MOCK_USER_ID = 'local-user-123';

	// Load data from database on app start
	const loadLocalData = useCallback(async () => {
		try {
			setIsLoadingData(true);
			setLoadingProgress(0);
			console.time('loadLocalData');
			
			// Define default folders
			const defaultFolders = [
				{ name: 'Books', description: 'Your reading notes and book summaries' },
				{ name: 'Knowledge Hub', description: 'General knowledge and learning notes' },
				{ name: 'Diary', description: 'Personal diary entries and reflections' }
			];

			setLoadingProgress(10);
			// Load all data in parallel for better performance
			// Use pagination for large datasets to improve performance
			const [folderResults, quizQuestions, noteResults, quizResultsData] = await Promise.all([
				supabase.from('folders').select('*').limit(1000),
				supabase.from('quiz_questions').select('*').limit(1000),
				supabase.from('notes').select('*').limit(1000),
				supabase.from('quiz_results').select('*').order('date', { ascending: false }).limit(500)
			]);
			setLoadingProgress(40);

			const savedFolders = folderResults.data;
			const saveNotes = noteResults.data;
			const saveQuizQuestions = quizQuestions.data;

			setLoadingProgress(50);
			// Process folders and notes efficiently
			if (savedFolders && savedFolders.length > 0) {
				// Create a map for faster note lookup
				const notesMap = new Map();
				if (saveNotes) {
					saveNotes.forEach((note: any) => {
						if (!notesMap.has(note.folder_id)) {
							notesMap.set(note.folder_id, []);
						}
						notesMap.get(note.folder_id).push({
							...note,
							createdAt: new Date(note.createdAt),
							updatedAt: new Date(note.updatedAt),
							lastReviewed: note.lastReviewed ? new Date(note.lastReviewed) : undefined,
						});
					});
				}

				// Process folders with optimized note assignment
				const parsedFolders = savedFolders.map((f: any) => ({
					...f,
					createdAt: new Date(f.createdAt),
					updatedAt: new Date(f.updatedAt),
					notes: notesMap.get(f.id) || [],
				}));

				setFolders(parsedFolders);
				setLoadingProgress(70);
				
				// Create missing default folders efficiently
				const existingFolderNames = new Set(parsedFolders.map(f => f.name));
				const missingDefaultFolders = defaultFolders.filter(folder => !existingFolderNames.has(folder.name));
				
				if (missingDefaultFolders.length > 0) {
					console.log('Creating missing default folders:', missingDefaultFolders.map(f => f.name));
					// Create default folders in parallel
					await Promise.all(
						missingDefaultFolders.map(folder => 
							createFolder(folder.name, folder.description).catch(error => {
								console.error(`Failed to create default folder ${folder.name}:`, error);
							})
						)
					);
				}
			} else {
				// No folders exist, create all default folders in parallel
				console.log('No folders found, creating default folders');
				await Promise.all(
					defaultFolders.map(folder => 
						createFolder(folder.name, folder.description).catch(error => {
							console.error(`Failed to create default folder ${folder.name}:`, error);
						})
					)
				);
			}

			setLoadingProgress(80);
			// Process quiz questions efficiently
			if (saveQuizQuestions) {
				setQuizQuestions(saveQuizQuestions);
			}

			// Process quiz results efficiently
			if (quizResultsData.data) {
				const parsedQuizResults = quizResultsData.data.map((result: any) => ({
					...result,
					date: new Date(result.date),
				}));
				setQuizResults(parsedQuizResults);
			}

			setLoadingProgress(100);
			console.timeEnd('loadLocalData');
			
			// Small delay to show "Ready!" message
			await new Promise(resolve => setTimeout(resolve, 500));
			
			setIsLoadingData(false);
			
			// Clean up any orphaned quiz results after loading data (non-blocking)
			setTimeout(() => {
				cleanupOrphanedQuizResults();
			}, 100);
		} catch (error) {
			console.error('Error loading local data:', error);
			setFolders([]);
			setQuizQuestions([]);
			setQuizResults([]);
			setIsLoadingData(false);
			setLoadingProgress(0);
		}
	}, []);

	// Clean up orphaned quiz results (results for folders with no notes)
	const cleanupOrphanedQuizResults = useCallback(async () => {
		try {
			console.log('Cleaning up orphaned quiz results...');
			
			// Get all folders that have no notes
			const foldersWithNoNotes = folders.filter(folder => folder.notes.length === 0);
			
			if (foldersWithNoNotes.length === 0) {
				console.log('No orphaned quiz results to clean up');
				return;
			}
			
			const folderIdsToClean = foldersWithNoNotes.map(folder => folder.id);
			console.log('Cleaning up quiz results for folders:', folderIdsToClean);
			
			// Delete quiz results for folders with no notes
			const { error } = await supabase
				.from('quiz_results')
				.delete()
				.in('folder_id', folderIdsToClean);
			
			if (error) {
				console.error('Error cleaning up orphaned quiz results:', error);
			} else {
				// Update local state
				setQuizResults(prevResults =>
					prevResults.filter(result => !folderIdsToClean.includes(result.folder_id))
				);
				console.log('Successfully cleaned up orphaned quiz results');
			}
		} catch (error) {
			console.error('Error in cleanupOrphanedQuizResults:', error);
		}
	}, [folders]);

	// Load additional data on demand for better performance
	const loadMoreData = useCallback(async (type: 'quiz_results' | 'quiz_questions' | 'notes', limit: number = 100) => {
		try {
			console.time(`loadMoreData-${type}`);
			
			switch (type) {
				case 'quiz_results': {
					const data = await supabase
						.from('quiz_results')
						.select('*')
						.order('date', { ascending: false })
						.range(quizResults.length, quizResults.length + limit - 1);
					if (data.data) {
						const newResults = data.data.map((result: any) => ({
							...result,
							date: new Date(result.date),
						}));
						setQuizResults(prev => [...prev, ...newResults]);
					}
					break;
				}
					
				case 'quiz_questions': {
					const data = await supabase
						.from('quiz_questions')
						.select('*')
						.range(quizQuestions.length, quizQuestions.length + limit - 1);
					if (data.data) {
						setQuizQuestions(prev => [...prev, ...data.data]);
					}
					break;
				}
					
				case 'notes':
					// This would need to be implemented per folder
					break;
			}
			
			console.timeEnd(`loadMoreData-${type}`);
		} catch (error) {
			console.error(`Error loading more ${type}:`, error);
		}
	}, [quizResults.length, quizQuestions.length]);

	// Save data to localStorage whenever folders change
	const saveLocalData = useCallback((foldersData: Folder[]) => {
		try {
			localStorage.setItem('memoquiz-folders', JSON.stringify(foldersData));
		} catch (error) {
			console.error('Error saving local data:', error);
		}
	}, []);

	useEffect(() => {
		loadLocalData();
	}, [loadLocalData]);

	useEffect(() => {
		saveLocalData(folders);
	}, [folders, saveLocalData]);

	// --- FOLDER CRUD WITH SUPABASE ---
	const createFolder = async (name: string, description?: string): Promise<Folder | null> => {
		try {
			const newFolder = {
				name,
				description: description || '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				user_id: MOCK_USER_ID,
			};
			const { data, error } = await supabase
				.from('folders')
				.insert([newFolder])
				.select();
			if (error) throw error;
			const folder: Folder = {
				...data[0],
				notes: [],
				createdAt: new Date(data[0].createdAt),
				updatedAt: new Date(data[0].updatedAt),
			};
			console.log(folder);
			setFolders(prev => [folder, ...prev]);
			toast({ title: 'Folder created', description: `Folder "${name}" created successfully.` });
			return folder;
		} catch (error) {
			console.error('Error creating folder:', error);
			toast({ title: 'Error', description: 'Failed to create folder. Please try again.', variant: 'destructive' });
			return null;
		}
	};

	const getQuizes = (folderId: string) => quizQuestions.filter(_q => _q.folder_id === folderId)

	const getQuizResults = async (folderId: string): Promise<QuizResult[]> => {
		try {
			const { data, error } = await supabase
				.from('quiz_results')
				.select('*')
				.eq('folder_id', folderId)
				.order('date', { ascending: false });

			if (error) throw error;
			return data?.map((result: any) => ({
				...result,
				date: new Date(result.date),
			})) || [];
		} catch (error) {
			console.error('Error loading quiz results:', error);
			return [];
		}
	};

	const getFolder = (id: string) => folders.find(folder => folder.id === id);

	const updateFolder = async (id: string, data: Partial<Folder>) => {
		try {
			const { error } = await supabase
				.from('folders')
				.update({ ...data, updatedAt: new Date().toISOString() })
				.eq('id', id);
			if (error) throw error;
			setFolders(prevFolders =>
				prevFolders.map(folder =>
					folder.id === id ? { ...folder, ...data, updatedAt: new Date() } : folder
				)
			);
			setCurrentFolder(prevCurrentFolder =>
				prevCurrentFolder && prevCurrentFolder.id === id
					? { ...prevCurrentFolder, ...data, updatedAt: new Date() }
					: prevCurrentFolder
			);
			toast({ title: 'Folder updated', description: `Folder "${data.name || 'updated'}" has been updated successfully.` });
		} catch (error) {
			console.error('Error updating folder:', error);
			toast({ title: 'Error', description: 'Failed to update folder. Please try again.', variant: 'destructive' });
		}
	};

	const deleteFolder = async (id: string) => {
		try {
			// Delete all quiz questions associated with this folder FIRST
			const { error: quizError } = await supabase
				.from('quiz_questions')
				.delete()
				.eq('folder_id', id);

			if (quizError) {
				console.error('Error deleting quiz questions:', quizError);
				// Continue with folder deletion even if quiz deletion fails
			}

			// Delete all quiz results associated with this folder
			const { error: resultsError } = await supabase
				.from('quiz_results')
				.delete()
				.eq('folder_id', id);

			if (resultsError) {
				console.error('Error deleting quiz results:', resultsError);
				// Continue with folder deletion even if results deletion fails
			}

			// Then delete the folder from Supabase
			const { error } = await supabase
				.from('folders')
				.delete()
				.eq('id', id);
			if (error) throw error;

			// Update local state - remove folder from folders
			setFolders(prevFolders => prevFolders.filter(folder => folder.id !== id));

			// Update local state - remove quiz questions associated with this folder
			setQuizQuestions(prevQuestions =>
				prevQuestions.filter(question => question.folder_id !== id)
			);

			// Update local state - remove quiz results associated with this folder
			setQuizResults(prevResults =>
				prevResults.filter(result => result.folder_id !== id)
			);

			// Update current quiz if it contains questions from the deleted folder
			if (currentQuiz) {
				setCurrentQuiz(currentQuiz.filter(question => question.folder_id !== id));
			}

			// Clear current folder and note if they're from the deleted folder
			if (currentFolder && currentFolder.id === id) setCurrentFolder(null);
			if (currentNote && currentNote.folder_id === id) setCurrentNote(null);

			toast({
				title: 'Folder deleted',
				description: `Folder, all its notes, quiz questions, and quiz results have been deleted successfully.`
			});
		} catch (error) {
			console.error('Error deleting folder:', error);
			toast({ title: 'Error', description: 'Failed to delete folder. Please try again.', variant: 'destructive' });
		}
	};

	// --- NOTE CRUD WITH SUPABASE ---
	const createNote = async (folderId: string, title: string, content: string): Promise<Note | null> => {
		if (!folderId) {
			toast({ title: 'Folder not specified', description: 'A folder must be selected to create a note.', variant: 'destructive' });
			return null;
		}
		try {
			const newNote = {
				folder_id: folderId,
				user_id: MOCK_USER_ID,
				title,
				content,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			const { data, error } = await supabase
				.from('notes')
				.insert([newNote])
				.select();
			if (error) throw error;
			const note: Note = {
				...data[0],
				createdAt: new Date(data[0].createdAt),
				updatedAt: new Date(data[0].updatedAt),
			};
			setFolders(prevFolders =>
				prevFolders.map(folder =>
					folder.id === folderId
						? { ...folder, notes: [...(folder.notes || []), note] }
						: folder
				)
			);
			setCurrentFolder(prevCurrentFolder =>
				prevCurrentFolder && prevCurrentFolder.id === folderId
					? { ...prevCurrentFolder, notes: [...(prevCurrentFolder.notes || []), note] }
					: prevCurrentFolder
			);
			toast({ title: 'Note created', description: `Note "${title}" created successfully.` });
			return note;
		} catch (error) {
			console.error('Error creating note:', error);
			toast({ title: 'Error', description: 'Failed to create note. Please try again.', variant: 'destructive' });
			return null;
		}
	};

	const getNote = (folderId: string, noteId: string): Note | undefined => {
		const folder = folders.find(f => f.id === folderId);
		if (!folder) return undefined;
		return folder.notes.find(n => n.id === noteId);
	};

	const updateNote = async (folderId: string, noteId: string, data: Partial<Note>) => {
		try {
			const { error } = await supabase
				.from('notes')
				.update({ ...data, updatedAt: new Date().toISOString() })
				.eq('id', noteId);
			if (error) throw error;
			setFolders(prevFolders =>
				prevFolders.map(folder =>
					folder.id === folderId
						? {
							...folder,
							notes: folder.notes.map(note =>
								note.id === noteId ? { ...note, ...data, updatedAt: new Date() } : note
							),
						}
						: folder
				)
			);
			setCurrentFolder(prevCurrentFolder =>
				prevCurrentFolder && prevCurrentFolder.id === folderId
					? {
						...prevCurrentFolder,
						notes: prevCurrentFolder.notes.map(note =>
							note.id === noteId ? { ...note, ...data, updatedAt: new Date() } : note
						),
					}
					: prevCurrentFolder
			);
			setCurrentNote(prevCurrentNote =>
				prevCurrentNote && prevCurrentNote.id === noteId
					? { ...prevCurrentNote, ...data, updatedAt: new Date() }
					: prevCurrentNote
			);
			toast({ title: 'Note updated', description: `Note "${data.title || 'updated'}" has been updated successfully.` });
			return true;
		} catch (error) {
			console.error('Error updating note:', error);
			toast({ title: 'Error', description: 'Failed to update note. Please try again.', variant: 'destructive' });
		}
		return false;
	};

	const deleteNote = async (folderId: string, noteId: string) => {
		try {
			// Delete all quiz questions associated with this note FIRST
			const { error: quizError } = await supabase
				.from('quiz_questions')
				.delete()
				.eq('note_id', noteId);

			if (quizError) {
				console.error('Error deleting quiz questions:', quizError);
				// Continue with note deletion even if quiz deletion fails
			}

			// Then delete the note from Supabase
			const { error } = await supabase
				.from('notes')
				.delete()
				.eq('id', noteId);
			if (error) throw error;

			// Update local state - remove note from folders
			setFolders(prevFolders =>
				prevFolders.map(folder =>
					folder.id === folderId
						? { ...folder, notes: folder.notes.filter(note => note.id !== noteId) }
						: folder
				)
			);

			// Update local state - remove quiz questions associated with this note
			setQuizQuestions(prevQuestions =>
				prevQuestions.filter(question => question.note_id !== noteId)
			);

			// Update current quiz if it contains questions from the deleted note
			if (currentQuiz) {
				setCurrentQuiz(currentQuiz.filter(question => question.note_id !== noteId));
			}

			// Clear current note if it's the one being deleted
			if (currentNote && currentNote.id === noteId) setCurrentNote(null);

			// Check if this was the last note in the folder
			const updatedFolder = folders.find(f => f.id === folderId);
			const remainingNotes = updatedFolder ? updatedFolder.notes.filter(note => note.id !== noteId) : [];
			
			// If no notes remain in the folder, clean up quiz results
			if (remainingNotes.length === 0) {
				console.log('No notes remaining in folder, cleaning up quiz results...');
				const { error: resultsError } = await supabase
					.from('quiz_results')
					.delete()
					.eq('folder_id', folderId);

				if (resultsError) {
					console.error('Error deleting quiz results:', resultsError);
				} else {
					// Update local state - remove quiz results for this folder
					setQuizResults(prevResults =>
						prevResults.filter(result => result.folder_id !== folderId)
					);
					
					toast({
						title: 'Note deleted',
						description: 'Note, associated quiz questions, and quiz history have been deleted successfully.'
					});
					return; // Early return to avoid duplicate toast
				}
			}

			toast({
				title: 'Note deleted',
				description: 'Note and associated quiz questions have been deleted successfully.'
			});
		} catch (error) {
			console.error('Error deleting note:', error);
			toast({ title: 'Error', description: 'Failed to delete note. Please try again.', variant: 'destructive' });
		}
	};

	const generateMultipleChoiceQuiz = async (folderId: string, selectedNoteIds?: string[]): Promise<QuizQuestion[]> => {
		setIsGeneratingQuiz(true);
		try {
			const folder = folders.find(f => f.id === folderId);

			if (!folder || !folder.notes.length) {
				toast({
					title: 'No content to quiz',
					description: 'This folder has no notes to generate quiz questions from.',
					variant: 'destructive'
				});
				return [];
			}
			
			// Filter notes based on selection
			const notesToUse = selectedNoteIds
				? folder.notes.filter(note => selectedNoteIds.includes(note.id))
				: folder.notes;

			const noteContents = notesToUse.map(note => ({
				id: note.id,
				title: note.title,
				content: note.content
			}));
			const questionsWithMeta: QuizQuestion[] = [];

			// Add delay between API calls to avoid rate limiting
			const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

			for (let i = 0; i < noteContents.length; i++) {
				const note = noteContents[i];

				try {
					// Add delay between requests (except for the first one)
					if (i > 0) {
						await delay(1000); // 1 second delay between requests
					}

					const res = await fetch("https://api.openai.com/v1/chat/completions", {
						method: "POST",
						headers: {
							"Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							model: "gpt-4o-mini",
							messages: [
								{
									role: "system",
									content:
										`
											You are an expert multiple choice quiz generator. For the content below, create 5 high-quality multiple choice questions with 4 options each.

											Multiple Choice Question Guidelines:
											- Each question must have exactly 4 options (A, B, C, D)
											- All options should be plausible and related to the content
											- Avoid obvious wrong answers that are clearly unrelated
											- Test different levels of understanding:
											  * Recall: Basic facts and definitions
											  * Comprehension: Understanding concepts
											  * Application: Using knowledge in new situations
											  * Analysis: Breaking down complex information
											- Include detailed explanations for why the correct answer is right
											- Make questions engaging and educational

											Format as a JSON array with 5 objects:
											{
												"question": "Clear, specific question text",
												"answer": "The correct answer (must match one of the options exactly)",
												"hint": "Helpful hint to guide the student",
												"noteId": "ID of the source note",
												"type": "multipleChoice",
												"options": ["Option A", "Option B", "Option C", "Option D"],
												"front": "Question text (same as question)",
												"back": "Correct answer (same as answer)",
												"tags": ["concept", "difficulty", "multipleChoice"],
												"explanation": "Detailed explanation of why the answer is correct and why others are wrong",
												"blanks": [],
												"correctOrder": [],
												"memoryPalace": { "location": "", "visualization": "", "associations": [] },
												"mnemonics": [],
												"relatedQuestions": []
											}

											Content to generate questions from:
											"${JSON.stringify(note)}"
										`
								},
								{
									role: "user",
									content: JSON.stringify(note)
								}
							]
						})
					});

					if (res.status === 429) {
						toast({
							title: 'Rate limit exceeded',
							description: 'Please wait a moment and try again. Consider selecting fewer notes.',
							variant: 'destructive'
						});
						setIsGeneratingQuiz(false);
						return [];
					}

					if (!res.ok) {
						throw new Error(`API request failed with status ${res.status}`);
					}
					const data = await res.json();
					const cleaned = data.choices[0].message.content
						.replace(/```json|```js|```/gi, '') // Remove code block markers
						.trim();
					// Parse the cleaned JSON string - expect an array of questions
					const questionsArray = JSON.parse(cleaned);

					// Ensure we have an array
					const questions = Array.isArray(questionsArray) ? questionsArray : [questionsArray];

					// Process each question in the array
					for (const question of questions) {
						let options = Array.isArray(question.options) ? [...question.options] : [];
						const answer = typeof question.answer === 'string' ? question.answer : 
							typeof question.back === 'string' ? question.back : 'No answer';
						
						// Ensure answer is in options for multipleChoice and format properly
						if (question.type === 'multipleChoice') {
							// Remove any empty or null options
							options = options.filter(opt => opt && opt.trim() !== '');
							
							// Ensure we have exactly 4 options
							while (options.length < 4) {
								options.push(`Option ${options.length + 1}`);
							}
							
							// Ensure the correct answer is in the options
							if (!options.includes(answer)) {
								// Replace a random option with the correct answer
								const randomIndex = Math.floor(Math.random() * options.length);
								options[randomIndex] = answer;
							}
							
							// Shuffle the options
							options = options.sort(() => Math.random() - 0.5);
						}
						
						// Add folder_id, user_id, and all required QuizQuestion fields to each question
						const now = new Date();
						questionsWithMeta.push({
							id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for type safety
							question: question.question,
							answer: question.answer,
							front: question.front,
							back: question.back,
							note_id: question.noteId,
							type: question.type,
							options: options,
							folder_id: folderId,
							user_id: MOCK_USER_ID,
							tags: getTagsForQuestion(question),
							hint: question.hint || '',
							explanation: question.explanation || '',
							blanks: question.blanks || [],
							correctOrder: question.correctOrder || [],
							difficulty: getDifficultyForQuestion(question),
							learningMetrics: {
								totalReviews: 0,
								correctStreak: 0,
								longestStreak: 0,
								averageResponseTime: 0,
								difficultyRating: 1,
								retentionRate: 0,
								lastAccuracy: 0
							},
							easeFactor: 2.5,
							interval: 1,
							repetitions: 0,
							lastReviewed: now,
							nextReviewDate: now,
							stability: 0,
							difficulty_sr: 0,
							retrievability: 1,
							lapses: 0,
							suspended: false,
							buried: false,
							memoryPalace: question.memoryPalace || undefined,
							mnemonics: question.mnemonics || [],
							relatedQuestions: question.relatedQuestions || [],
							createdAt: now,
							updatedAt: now,
							source: 'generated',
							confidence: 3
						});
					}
				} catch (error) {
					console.error(`Error generating questions for note ${note.id}:`, error);
					toast({
						title: 'Error generating questions',
						description: `Failed to generate questions for "${note.title}". Please try again.`,
						variant: 'destructive'
					});
				}
			}

			// Save all generated questions to the database
			for (const question of questionsWithMeta) {
				try {
					await createQuestion(folderId, question);
				} catch (error) {
					console.error('Error saving question:', error);
				}
			}

			toast({
				title: 'Multiple Choice Quiz Generated',
				description: `Successfully generated ${questionsWithMeta.length} multiple choice questions!`,
				duration: 3000
			});

			setIsGeneratingQuiz(false);
			return questionsWithMeta;
		} catch (error) {
			console.error('Error generating multiple choice quiz:', error);
			toast({
				title: 'Error',
				description: 'Failed to generate multiple choice quiz. Please try again.',
				variant: 'destructive'
			});
			setIsGeneratingQuiz(false);
			return [];
		}
	};

	const generateQuiz = async (folderId: string, selectedNoteIds?: string[]): Promise<QuizQuestion[]> => {
		setIsGeneratingQuiz(true);
		try {
			const folder = folders.find(f => f.id === folderId);

			if (!folder || !folder.notes.length) {
				toast({
					title: 'No content to quiz',
					description: 'This folder has no notes to generate quiz questions from.',
					variant: 'destructive'
				});
				return [];
			}
			// Filter notes based on selection
			const notesToUse = selectedNoteIds
				? folder.notes.filter(note => selectedNoteIds.includes(note.id))
				: folder.notes;

			const noteContents = notesToUse.map(note => ({
				id: note.id,
				title: note.title,
				content: note.content
			}));
			const questionsWithMeta: QuizQuestion[] = [];

			// Add delay between API calls to avoid rate limiting
			const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

			for (let i = 0; i < noteContents.length; i++) {
				const note = noteContents[i];

				try {
					// Add delay between requests (except for the first one)
					if (i > 0) {
						await delay(1000); // 1 second delay between requests
					}

					const res = await fetch("https://api.openai.com/v1/chat/completions", {
						method: "POST",
						headers: {
							"Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							model: "gpt-4o-mini",
							messages: [
								{
									role: "system",
									content:
										`
											You are an expert quiz generator. For the content below, create 5 high-quality questions with a focus on multiple choice questions. Generate a mix of question types:

											Question Types to Generate:
											- 3 Multiple Choice questions (with 4 options each)
											- 1 Fill-in-the-blank question
											- 1 True/False question

											For Multiple Choice questions:
											- Make sure all 4 options are plausible and related to the content
											- Avoid obvious wrong answers
											- Include explanations for why the correct answer is right
											- Test different levels of understanding (recall, comprehension, application)

											Format as a JSON array with 5 objects, where each object has these fields:
											{
												"question": "Question text",
												"answer": "Correct answer",
												"hint": "Helpful hint (optional)",
												"noteId": "ID of the source note",
												"type": "multipleChoice | fillInBlank | trueFalse",
												"options": ["Option A", "Option B", "Option C", "Option D"], // Only for multipleChoice
												"front": "Question text (same as question)",
												"back": "Correct answer (same as answer)",
												"tags": ["concept", "difficulty", "type"],
												"explanation": "Detailed explanation of why the answer is correct",
												"blanks": [], // For fillInBlank questions
												"correctOrder": [],
												"memoryPalace": { "location": "", "visualization": "", "associations": [] },
												"mnemonics": [],
												"relatedQuestions": []
											}

											Guidelines:
											- Questions should test understanding, not just memorization
											- Include a mix of factual, conceptual, and application questions
											- Make multiple choice distractors plausible but clearly wrong
											- Provide clear, educational explanations
											- Do not include learningMetrics, difficulty, or spaced repetition fields

											Content to generate questions from:
											"${JSON.stringify(note)}"
										`
								},
								{
									role: "user",
									content: JSON.stringify(note)
								}
							]
						})
					});

					if (res.status === 429) {
						toast({
							title: 'Rate limit exceeded',
							description: 'Please wait a moment and try again. Consider selecting fewer notes.',
							variant: 'destructive'
						});
						setIsGeneratingQuiz(false);
						return [];
					}

					if (!res.ok) {
						throw new Error(`API request failed with status ${res.status}`);
					}
					const data = await res.json();
					const cleaned = data.choices[0].message.content
						.replace(/```json|```js|```/gi, '') // Remove code block markers
						.trim();
					// Parse the cleaned JSON string - expect an array of questions
					const questionsArray = JSON.parse(cleaned);

					// Ensure we have an array
					const questions = Array.isArray(questionsArray) ? questionsArray : [questionsArray];

					// Process each question in the array
					for (const question of questions) {
						let options = Array.isArray(question.options) ? [...question.options] : [];
						const answer = typeof question.answer === 'string' ? question.answer : 
							typeof question.back === 'string' ? question.back : 'No answer';
						
						// Ensure answer is in options for multipleChoice and format properly
						if (question.type === 'multipleChoice') {
							// Remove any empty or null options
							options = options.filter(opt => opt && opt.trim() !== '');
							
							// Ensure we have exactly 4 options
							while (options.length < 4) {
								options.push(`Option ${options.length + 1}`);
							}
							
							// Ensure the correct answer is in the options
							if (!options.includes(answer)) {
								// Replace a random option with the correct answer
								const randomIndex = Math.floor(Math.random() * options.length);
								options[randomIndex] = answer;
							}
							
							// Shuffle the options
							options = options.sort(() => Math.random() - 0.5);
						}
						// Add folder_id, user_id, and all required QuizQuestion fields to each question, and add Anki-compatible fields
						const now = new Date();
						questionsWithMeta.push({
							id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for type safety
							question: question.question,
							answer: question.answer,
							front: question.front,
							back: question.back,
							note_id: question.noteId,
							type: question.type,
							options: options,
							folder_id: folderId,
							user_id: MOCK_USER_ID,
							tags: getTagsForQuestion(question),
							hint: question.hint || '',
							explanation: question.explanation || '',
							blanks: question.blanks || [],
							correctOrder: question.correctOrder || [],
							difficulty: getDifficultyForQuestion(question),
							learningMetrics: {
								totalReviews: 0,
								correctStreak: 0,
								longestStreak: 0,
								averageResponseTime: 0,
								difficultyRating: 1,
								retentionRate: 0,
								lastAccuracy: 0
							},
							easeFactor: 2.5,
							interval: 1,
							repetitions: 0,
							lastReviewed: now,
							nextReviewDate: now,
							stability: 0,
							difficulty_sr: 0,
							retrievability: 1,
							lapses: 0,
							suspended: false,
							buried: false,
							memoryPalace: question.memoryPalace || undefined,
							mnemonics: question.mnemonics || [],
							relatedQuestions: question.relatedQuestions || [],
							createdAt: now,
							updatedAt: now,
							source: 'generated',
							confidence: 3
						});
					}

					// Delete existing questions for this note
					await supabase.from('quiz_questions').delete().eq('folder_id', folderId).eq('note_id', note.id);
					toast({ title: `Quiz "${note.title}" questions saved` });
				} catch (error) {
					console.error(`Error processing note ${note.id}:`, error);
					toast({
						title: 'Error generating questions',
						description: `Failed to generate questions for note "${note.title}". Please try again.`,
						variant: 'destructive'
					});
					// Continue with other notes instead of failing completely
					continue;
				}
			}

			// Save all questions at once
			if (questionsWithMeta.length > 0) {
				setQuizQuestions(questionsWithMeta);
				// Remove temporary IDs for Supabase auto-generation
				const questionsForSupabase = questionsWithMeta.map(({ id, ...question }) => question);
				const { error } = await supabase
					.from('quiz_questions')
					.upsert(questionsForSupabase);
				if (error) {
					toast({ title: 'Error saving quiz questions', description: error.message, variant: 'destructive' });
					setIsGeneratingQuiz(false);
					return [];
				}
				else {
					toast({ title: `${questionsWithMeta.length} Quiz questions saved`, description: `Saved ${questionsWithMeta.length} questions for review.` });
				}
				setCurrentQuiz(questionsWithMeta);
				toast({ title: `Quiz about ${notesToUse.length} notes generated`, description: `Generated and saved ${questionsWithMeta.length} questions for review.` });
			}

			setIsGeneratingQuiz(false);
			return questionsWithMeta;
		} catch (error) {
			setIsGeneratingQuiz(false);
			console.error('Error generating quiz:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz questions.';
			toast({
				title: 'Error generating quiz',
				description: errorMessage,
				variant: 'destructive'
			});
			return [];
		}
	};

	const saveQuizResult = async (result: Omit<QuizResult, 'id' | 'user_id'>) => {
		try {
			const newResult: QuizResult = {
				...result,
				date: new Date(),
				user_id: MOCK_USER_ID,
			};

			// Save to Supabase first
			console.log('Saving quiz result to Supabase:', newResult);
			const { data, error } = await supabase
				.from('quiz_results')
				.insert({
					folder_id: newResult.folder_id,
					user_id: newResult.user_id,
					date: newResult.date.toISOString(),
					correctAnswers: newResult.correctAnswers,
					totalQuestions: newResult.totalQuestions,
					questionResults: newResult.questionResults || []
				})
				.select();

			if (error) {
				console.error('Error saving quiz result to Supabase:', error);
				throw error;
			}

			// Update local state with the saved result (including the ID from Supabase)
			if (data && data[0]) {
				const savedResult = {
					...data[0],
					date: new Date(data[0].date),
				};
				setQuizResults(prev => [savedResult, ...prev]);
			}

			console.log('Quiz result saved successfully to Supabase');

			toast({
				title: 'Quiz completed',
				description: `Score: ${result.correctAnswers}/${result.totalQuestions} (${Math.round(result.correctAnswers / result.totalQuestions * 100)}%)`
			});
		} catch (error) {
			console.error('Error saving quiz result:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to save quiz results.';
			toast({
				title: 'Error saving results',
				description: errorMessage,
				variant: 'destructive'
			});
		}
	};

	const updateQuestionSpacedRepetitionData = async (folderId: string, questionId: string, correct: boolean) => {
		try {
			// For local storage, we could save this data, but for simplicity we'll just log it
			const performanceRating = correct ? 1 : 0;
			const mockQuestion: QuizQuestion = {
				id: questionId,
				folder_id: folderId,
				note_id: '',
				user_id: MOCK_USER_ID,
				question: '',
				answer: '',
				type: 'fillInBlank',
				difficulty: { level: 'beginner', cognitiveLoad: 'low', timeEstimate: 30 },
				learningMetrics: {
					totalReviews: 0,
					correctStreak: 0,
					longestStreak: 0,
					averageResponseTime: 0,
					difficultyRating: 3,
					retentionRate: 0,
					lastAccuracy: 0
				},
				easeFactor: 2.5,
				interval: 1,
				repetitions: 0,
				lastReviewed: new Date(),
				nextReviewDate: new Date(),
				stability: 0,
				difficulty_sr: 0,
				retrievability: 0,
				lapses: 0,
				suspended: false,
				buried: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				source: 'manual',
				confidence: 3
			};

			const { easeFactor, interval } = calculateNextReview(mockQuestion, performanceRating);

			console.log(`Updated spaced repetition data for question ${questionId}: correct=${correct}, newInterval=${interval}, newEaseFactor=${easeFactor}`);
		} catch (error) {
			console.error('Error updating question spaced repetition data:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to update question data.';
			toast({
				title: 'Error updating question',
				description: errorMessage,
				variant: 'destructive'
			});
		}
	};



	// Quiz management functions
	const getFolderQuestions = (folderId: string): QuizQuestion[] => {
		return quizQuestions.map((q: any) => ({
			...q,
			nextReviewDate: new Date(q.nextReviewDate),
			lastReviewed: q.lastReviewed ? new Date(q.lastReviewed) : null,
		}));
	};

	const createQuestion = async (folderId: string, data: QuizQuestion): Promise<void> => {
		// Ensure all required fields for QuizQuestion are present and not undefined
		console.log('Creating question in Supabase:', data);
		try {
			const { error } = await supabase
				.from('quiz_questions')
				.insert([{ ...data, id: undefined, folder_id: folderId }]);

			if (error) {
				console.error('Error creating question in Supabase:', error);
				throw error;
			}
		} catch (error) {
			console.error('Failed to create question in Supabase:', error);
		}

		const questions = getFolderQuestions(folderId);
		const updatedQuestions = [...questions, data];
		setQuizQuestions(updatedQuestions);
		// Update current quiz if it's loaded
		if (currentQuiz) {
			setCurrentQuiz([...currentQuiz, data]);
		}
	}

	const updateQuestion = async (questionId: string, data: Partial<QuizQuestion>): Promise<void> => {
		// Find which folder this question belongs to
		const allFolders = folders;
		let targetFolderId = '';
		for (const folder of allFolders) {
			const questions = getFolderQuestions(folder.id);
			if (questions.find(q => q.id === questionId)) {
				targetFolderId = folder.id;
				break;
			}
		}

		if (!targetFolderId) return;

		const questions = getFolderQuestions(targetFolderId);
		const updatedQuestions = questions.map(q =>
			q.id === questionId ? { ...q, ...data, updatedAt: new Date() } : q
		);


		setQuizQuestions(updatedQuestions);
		// Update current quiz if it's loaded
		if (currentQuiz) {
			setCurrentQuiz(currentQuiz.map(q =>
				q.id === questionId ? { ...q, ...data, updatedAt: new Date() } : q
			));
		}

		// Save to Supabase
		console.log('Updating question in Supabase:', data);
		try {
			const { error } = await supabase
				.from('quiz_questions')
				.update({
					...data,
					updatedAt: new Date().toISOString()
				})
				.eq('id', questionId);

			if (error) {
				console.error('Error updating question in Supabase:', error);
				throw error;
			}

			console.log('Question updated successfully in Supabase');
		} catch (error) {
			console.error('Failed to update question in Supabase:', error);
		}
	};

	const deleteQuestion = (questionId: string): void => {
		// Find which folder this question belongs to
		const allFolders = folders;
		let targetFolderId = '';

		for (const folder of allFolders) {
			const questions = getFolderQuestions(folder.id);
			if (questions.find(q => q.id === questionId)) {
				targetFolderId = folder.id;
				break;
			}
		}

		if (!targetFolderId) return;

		const questions = getFolderQuestions(targetFolderId);
		const updatedQuestions = questions.filter(q => q.id !== questionId);

		localStorage.setItem(`quiz-questions-${targetFolderId}`, JSON.stringify(updatedQuestions));

		// Update current quiz if it's loaded
		if (currentQuiz) {
			setCurrentQuiz(currentQuiz.filter(q => q.id !== questionId));
		}
	};



	// Utility: Determine difficulty for a question
	function getDifficultyForQuestion(q: any): QuestionDifficulty {
		// Example logic: adjust based on type, options, or keywords
		if (q.type === 'multipleChoice' && q.options && q.options.length > 2) {
			return { level: 'beginner', cognitiveLoad: 'low', timeEstimate: 30 };
		}
		if (q.type === 'fillInBlank') {
			return { level: 'intermediate', cognitiveLoad: 'medium', timeEstimate: 45 };
		}
		if (q.type === 'cloze') {
			return { level: 'advanced', cognitiveLoad: 'high', timeEstimate: 60 };
		}
		// Fallback
		return { level: 'beginner', cognitiveLoad: 'low', timeEstimate: 30 };
	}

	// Utility: Generate tags for a question
	function getTagsForQuestion(q: any): string[] {
		const tags: string[] = [];
		if (q.type) tags.push(q.type);
		if (q.topic) tags.push(q.topic);
		if (q.options && Array.isArray(q.options)) {
			tags.push(...q.options.filter((opt: string) => typeof opt === 'string' && opt.length < 20));
		}
		// Add more logic as needed (e.g., keywords in question)
		return tags;
	}

	const value: AppContextType = {
		folders,
		currentFolder,
		currentNote,
		currentQuiz,
		quizQuestions,
		quizResults,
		isLoadingData,
		loadingProgress,
		cleanupOrphanedQuizResults,
		createFolder,
		getFolder,
		getQuizes,
		getQuizResults,
		updateFolder,
		deleteFolder,
		setCurrentFolder,
		createNote,
		getNote,
		updateNote,
		deleteNote,
		setCurrentNote,
		generateQuiz,
		generateMultipleChoiceQuiz,
		saveQuizResult,
		updateQuestionSpacedRepetitionData,
		isGeneratingQuiz,
		// Quiz management functions
		getFolderQuestions,
		updateQuestion,
		createQuestion,
		deleteQuestion,
		// New category/entry system
		categories,
		entries,
		currentCategory,
		currentEntry,
		createCategory: async () => null,
		getCategory: () => undefined,
		updateCategory: async () => { },
		deleteCategory: async () => { },
		setCurrentCategory: () => { },
		createEntry: async () => null,
		getEntry: () => undefined,
		updateEntry: async () => { },
		deleteEntry: async () => { },
		setCurrentEntry: () => { },
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within an AppProvider');
	}
	return context;
};
