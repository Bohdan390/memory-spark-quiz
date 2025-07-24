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
	quizResults: QuizResult[];
	isLoadingData: boolean;

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
	saveQuizResult: (result: Omit<QuizResult, 'id' | 'user_id'>) => Promise<void>;
	updateQuestionSpacedRepetitionData: (folderId: string, questionId: string, correct: boolean) => Promise<void>;
	isGeneratingQuiz: boolean;

	// Quiz management functions
	getFolderQuestions: (folderId: string) => QuizQuestion[];
	updateQuestion: (questionId: string, data: Partial<QuizQuestion>) => Promise<void>;
	createQuestion: (folderId: string, data: QuizQuestion) => Promise<void>;
	deleteQuestion: (questionId: string) => void;
	addQuestion: (folderId: string, question: Omit<QuizQuestion, 'id' | 'user_id'>) => QuizQuestion;

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
	const [folderQuestions, setFolderQuestions] = useState<QuizQuestion | null>(null);

	// New category/entry state
	const [categories, setCategories] = useState<Category[]>([]);
	const [entries, setEntries] = useState<Entry[]>([]);
	const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
	const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);

	const { toast } = useToast();

	// Mock user ID for local storage
	const MOCK_USER_ID = 'local-user-123';

	// Load data from localStorage on app start
	const loadLocalData = useCallback(async () => {
		try {
			const folderResults = await supabase
				.from('folders')
				.select('*');

			const savedFolders = folderResults.data;
			// const savedFolders = localStorage.getItem('memoquiz-folders');
			// const savedQuizResults = localStorage.getItem('memoquiz-quiz-results');
			const quizQuestions = await supabase
				.from('quiz_questions')
				.select('*');

			const noteResults = await supabase
				.from('notes')
				.select('*');

			const quizResultsData = await supabase
				.from('quiz_results')
				.select('*')
				.order('date', { ascending: false });

			const saveNotes = noteResults.data

			const saveQuizQuestions = quizQuestions.data
			// Removed broken supabase code; setQuestions is not defined and supabase call is not awaited.
			// If you want to load quiz questions from localStorage, you could do it here.
			if (savedFolders) {
				const parsedFolders = savedFolders.map((f: any) => {
					var notes = saveNotes?.filter(_n => _n.folder_id == f.id);
					return {
						...f,
						createdAt: new Date(f.createdAt),
						updatedAt: new Date(f.updatedAt),
						notes: (notes || []).map((n: any) => ({
							...n,
							createdAt: new Date(n.createdAt),
							updatedAt: new Date(n.updatedAt),
							lastReviewed: n.lastReviewed ? new Date(n.lastReviewed) : undefined,
						})),
					}
				});
				setFolders(parsedFolders);
			}

			if (saveQuizQuestions) {
				const parsedQuestions = saveQuizQuestions.map((r: any) => ({
					...r,
				}));
				setQuizQuestions(parsedQuestions);
			}

			if (quizResultsData.data) {
				const parsedQuizResults = quizResultsData.data.map((result: any) => ({
					...result,
					date: new Date(result.date),
				}));
				setQuizResults(parsedQuizResults);
			}
		} catch (error) {
			console.error('Error loading local data:', error);
			setFolders([]);
			setQuizQuestions([]);
			setQuizResults([]);
		}
	}, []);

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

			toast({ 
				title: 'Note deleted', 
				description: 'Note and associated quiz questions have been deleted successfully.' 
			});
		} catch (error) {
			console.error('Error deleting note:', error);
			toast({ title: 'Error', description: 'Failed to delete note. Please try again.', variant: 'destructive' });
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
                     You are a quiz generator. For a journal entry below, create 3 multiple-choice questions with 4 options. Format as a JSON array with 3 objects, where each object has the following fields:
                     {
                       "question": "Question text",
                       "answer": "Correct answer",
                       "hint": "Hint (optional)",
                       "noteId": "ID of the source note",
                       "type": "multipleChoice",
                       "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                       "front": "Question text (same as question)",
                       "back": "Correct answer (same as answer)",
                       "tags": ["tag1", "tag2", "type"],
                       "explanation": "Detailed explanation (optional)",
                       "blanks": [],
                       "correctOrder": [],
                       "memoryPalace": { "location": "", "visualization": "", "associations": [] },
                       "mnemonics": [],
                       "relatedQuestions": []
                     }
                     Do not include fields like learningMetrics, difficulty, or spaced repetition fields; these will be filled by the app. Output only a JSON array of 3 objects.
                     Journal entry:
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
						const answer = typeof question.back === 'string' ? question.back : 'No answer';
						// Ensure answer is in options for multipleChoice
						if (question.type === 'multipleChoice' && !options.includes(answer)) {
							options.push(answer);
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

	const addQuestion = (folderId: string, question: Omit<QuizQuestion, 'id' | 'user_id'>): QuizQuestion => {
		const newQuestion: QuizQuestion = {
			...question,
			id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
			user_id: 'local-user-123',
			difficulty: question.difficulty || { level: 'beginner', cognitiveLoad: 'low', timeEstimate: 30 },
			learningMetrics: question.learningMetrics || {
				totalReviews: 0,
				correctStreak: 0,
				longestStreak: 0,
				averageResponseTime: 0,
				difficultyRating: 3,
				retentionRate: 0,
				lastAccuracy: 0
			},
			repetitions: question.repetitions || 0,
			stability: question.stability || 0,
			difficulty_sr: question.difficulty_sr || 0,
			retrievability: question.retrievability || 0,
			lapses: question.lapses || 0,
			suspended: question.suspended || false,
			buried: question.buried || false,
			createdAt: question.createdAt || new Date(),
			updatedAt: question.updatedAt || new Date(),
			source: question.source || 'manual',
			confidence: question.confidence || 3
		};

		const questions = getFolderQuestions(folderId);
		const updatedQuestions = [...questions, newQuestion];

		localStorage.setItem(`quiz-questions-${folderId}`, JSON.stringify(updatedQuestions));

		// Update current quiz if it's loaded for this folder
		if (currentQuiz && currentFolder?.id === folderId) {
			setCurrentQuiz([...currentQuiz, newQuestion]);
		}

		return newQuestion;
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
		quizResults,
		isLoadingData,
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
		saveQuizResult,
		updateQuestionSpacedRepetitionData,
		isGeneratingQuiz,
		// Quiz management functions
		getFolderQuestions,
		updateQuestion,
		createQuestion,
		deleteQuestion,
		addQuestion,
		// New category/entry system
		categories,
		entries,
		currentCategory,
		currentEntry,
		createCategory: async () => null,
		getCategory: () => undefined,
		updateCategory: async () => {},
		deleteCategory: async () => {},
		setCurrentCategory: () => {},
		createEntry: async () => null,
		getEntry: () => undefined,
		updateEntry: async () => {},
		deleteEntry: async () => {},
		setCurrentEntry: () => {},
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
