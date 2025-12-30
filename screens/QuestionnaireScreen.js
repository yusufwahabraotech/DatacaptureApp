import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '../components/BottomNavigation';
import ApiService from '../services/api';

const QuestionnaireScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sendTo: 'Individuals',
    sections: [
      {
        id: 1,
        title: 'SECTION 1',
        questions: [
          { id: 1, question: '', type: 'Text' },
          { id: 2, question: '', type: 'Text' },
          { id: 3, question: '', type: 'Text' },
          { id: 4, question: '', type: 'Text' },
          { id: 5, question: '', type: 'Text' },
          { id: 6, question: '', type: 'Text' },
          { id: 7, question: '', type: 'Text' },
        ]
      },
      {
        id: 2,
        title: 'SECTION 2',
        questions: [
          { id: 1, question: '', type: 'Text' },
        ]
      }
    ]
  });

  const [questionnaires, setQuestionnaires] = useState([
    { id: 1, title: 'Health Assessment', questions: 15, completed: 12, status: 'In Progress', date: '2024-01-15' },
    { id: 2, title: 'Fitness Evaluation', questions: 20, completed: 20, status: 'Completed', date: '2024-01-14' },
    { id: 3, title: 'Nutrition Survey', questions: 25, completed: 8, status: 'In Progress', date: '2024-01-13' },
  ]);

  const questionTypes = ['Text', 'Multiple Choice', 'Yes/No', 'Rating', 'Date', 'Number', 'Email', 'Phone', 'Dropdown', 'Checkbox', 'File Upload', 'Scale (1-10)'];
  const sendToOptions = ['Individuals', 'Group', 'All'];
  const [showQuestionTypeDropdown, setShowQuestionTypeDropdown] = useState({});
  const [showSendToDropdown, setShowSendToDropdown] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getUserProfile();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  const addNewField = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              questions: [...section.questions, {
                id: section.questions.length + 1,
                question: '',
                type: 'Text'
              }]
            }
          : section
      )
    }));
  };

  const addNewSection = () => {
    const newSection = {
      id: formData.sections.length + 1,
      title: `SECTION ${formData.sections.length + 1}`,
      questions: [{ id: 1, question: '', type: 'Text' }]
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const deleteSection = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const updateQuestion = (sectionId, questionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              questions: section.questions.map(q => 
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : section
      )
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'In Progress': return '#7C3AED';
      case 'Draft': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Questionnaires</Text>
        <View style={styles.headerRight}>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
          </View>
          <TouchableOpacity 
            style={styles.profileImage}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!showCreateForm ? (
          <>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={24} color="#7C3AED" />
                <Text style={styles.statNumber}>{questionnaires.length}</Text>
                <Text style={styles.statLabel}>Total Forms</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.statNumber}>{questionnaires.filter(q => q.status === 'Completed').length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#7C3AED" />
                <Text style={styles.statNumber}>{questionnaires.filter(q => q.status === 'In Progress').length}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
            </View>

            {/* Create New Button */}
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.createButtonText}>Create New Questionnaire</Text>
            </TouchableOpacity>

            {/* Recent Questionnaires */}
            <View style={styles.questionnairesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Questionnaires</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {questionnaires.map((item) => (
                <View key={item.id} style={styles.questionnaireCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View style={styles.questionnaireIcon}>
                        <Ionicons name="document-text-outline" size={24} color="#7C3AED" />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.questionnaireTitle}>{item.title}</Text>
                        <Text style={styles.questionnaireDetails}>
                          {item.completed}/{item.questions} questions completed
                        </Text>
                        <Text style={styles.questionnaireDate}>{item.date}</Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                          {item.status}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {item.questions > 0 && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${getProgressPercentage(item.completed, item.questions)}%`,
                              backgroundColor: getStatusColor(item.status)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {getProgressPercentage(item.completed, item.questions)}% Complete
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          /* Questionnaire Form */
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowCreateForm(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#7C3AED" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Create Questionnaire</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter questionnaire title"
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              />
            </View>



            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Send To</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowSendToDropdown(!showSendToDropdown)}
              >
                <Text style={styles.dropdownText}>{formData.sendTo}</Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {showSendToDropdown && (
                <View style={styles.dropdownMenu}>
                  {sendToOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, sendTo: option }));
                        setShowSendToDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Sections */}
            {formData.sections.map((section, sectionIndex) => (
              <View key={`section-${section.id}`} style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {formData.sections.length > 1 && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteSection(section.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {section.questions.map((question, questionIndex) => (
                  <View key={`section-${section.id}-question-${question.id}`} style={styles.questionContainer}>
                    <Text style={styles.questionLabel}>Question {question.id}</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={`Question ${question.id}`}
                      value={question.question}
                      onChangeText={(text) => updateQuestion(section.id, question.id, 'question', text)}
                    />
                    
                    <Text style={styles.questionLabel}>Question type</Text>
                    <TouchableOpacity 
                      style={styles.dropdown}
                      onPress={() => setShowQuestionTypeDropdown(prev => ({
                        ...prev,
                        [`${section.id}-${question.id}`]: !prev[`${section.id}-${question.id}`]
                      }))}
                    >
                      <Text style={styles.dropdownText}>{question.type}</Text>
                      <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showQuestionTypeDropdown[`${section.id}-${question.id}`] && (
                      <View style={styles.dropdownMenu}>
                        {questionTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={styles.dropdownItem}
                            onPress={() => {
                              updateQuestion(section.id, question.id, 'type', type);
                              setShowQuestionTypeDropdown(prev => ({
                                ...prev,
                                [`${section.id}-${question.id}`]: false
                              }));
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
                
                <TouchableOpacity 
                  style={styles.addFieldButton}
                  onPress={() => addNewField(section.id)}
                >
                  <Ionicons name="add" size={20} color="#7C3AED" />
                  <Text style={styles.addFieldText}>Add New Field</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addSectionButton}
              onPress={addNewSection}
            >
              <Ionicons name="add-circle" size={24} color="#7C3AED" />
              <Text style={styles.addSectionText}>Add New Section</Text>
            </TouchableOpacity>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Questionnaire</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}



        {/* Empty State */}
        {questionnaires.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No questionnaires yet</Text>
            <Text style={styles.emptySubtitle}>Create your first questionnaire to get started</Text>
          </View>
        )}
      </ScrollView>



      <BottomNavigation navigation={navigation} activeTab="Questionnaire" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.04)',
    bottom: -50,
    left: -50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  templatesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  templatesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  templateSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  questionnairesSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  questionnaireCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionnaireIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  questionnaireTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  questionnaireDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  questionnaireDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    padding: 4,
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingBottom: 24,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  activeNavText: {
    color: '#7C3AED',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  addFieldText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 8,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
  },
  addSectionText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
    marginLeft: 8,
  },
  formActions: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});

export default QuestionnaireScreen;