import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';

// Mock registered users database (in real app, this would be from your backend)
const REGISTERED_USERS = [
  { id: '1', name: 'Alice Johnson', phone: '+1234567890', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
  { id: '2', name: 'Bob Smith', phone: '+1234567891', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
  { id: '3', name: 'Carol Williams', phone: '+1234567892', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
  { id: '4', name: 'David Brown', phone: '+1234567893', avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
  { id: '5', name: 'Emma Davis', phone: '+1234567894', avatar: 'https://randomuser.me/api/portraits/women/5.jpg' },
];

class ContactsService {
  /**
   * Request contacts permission
   */
  static async requestContactsPermission() {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Check if contacts permission is granted
   */
  static async checkContactsPermission() {
    const { status } = await Contacts.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get all contacts from device
   */
  static async getContacts() {
    try {
      const hasPermission = await this.checkContactsPermission();
      if (!hasPermission) {
        const granted = await this.requestContactsPermission();
        if (!granted) {
          throw new Error('Contacts permission denied');
        }
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      return data.filter(contact => 
        contact.phoneNumbers && contact.phoneNumbers.length > 0
      );
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  /**
   * Match contacts with registered users
   */
  static async getRegisteredContacts() {
    try {
      const contacts = await this.getContacts();
      
      const registeredContacts = contacts.map(contact => {
        const contactPhone = contact.phoneNumbers?.[0]?.number?.replace(/\D/g, '');
        
        const registeredUser = REGISTERED_USERS.find(user => {
          const userPhone = user.phone.replace(/\D/g, '');
          return userPhone === contactPhone || userPhone.endsWith(contactPhone?.slice(-10));
        });

        if (registeredUser) {
          return {
            id: registeredUser.id,
            name: registeredUser.name,
            phone: registeredUser.phone,
            avatar: registeredUser.avatar,
            isRegistered: true,
            contactId: contact.id,
          };
        }

        return {
          id: contact.id,
          name: contact.name || 'Unknown',
          phone: contact.phoneNumbers?.[0]?.number || '',
          avatar: null,
          isRegistered: false,
          contactId: contact.id,
        };
      });

      return registeredContacts;
    } catch (error) {
      console.error('Error matching contacts:', error);
      throw error;
    }
  }

  /**
   * Get only registered friends
   */
  static async getRegisteredFriends() {
    const allContacts = await this.getRegisteredContacts();
    return allContacts.filter(contact => contact.isRegistered);
  }

  /**
   * Get only non-registered contacts (for inviting)
   */
  static async getInviteableContacts() {
    const allContacts = await this.getRegisteredContacts();
    return allContacts.filter(contact => !contact.isRegistered);
  }

  /**
   * Check if SMS is available
   */
  static async isSMSAvailable() {
    const isAvailable = await SMS.isAvailableAsync();
    return isAvailable;
  }

  /**
   * Send SMS invite to a contact
   */
  static async sendSMSInvite(phoneNumber, userName, propertyName) {
    try {
      const isAvailable = await this.isSMSAvailable();
      if (!isAvailable) {
        throw new Error('SMS not available on this device');
      }

      const message = `Hey! I'm inviting you to join me on Estatery to check out ${propertyName}. Download the app to view properties and book together!`;
      
      const { result } = await SMS.sendSMSAsync([phoneNumber], message);
      return result === 'sent';
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send bulk SMS invites
   */
  static async sendBulkSMSInvites(phoneNumbers, userName, propertyName) {
    try {
      const isAvailable = await this.isSMSAvailable();
      if (!isAvailable) {
        throw new Error('SMS not available on this device');
      }

      const message = `Hey! I'm inviting you to join me on Estatery to check out ${propertyName}. Download the app to view properties and book together!`;
      
      const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
      return result === 'sent';
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw error;
    }
  }
}

export default ContactsService;
