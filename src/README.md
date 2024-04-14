# **Functions**

### **getUri()**

<u>**Description:**</u>
Aceasta functie returneaza URI-ul asociat unui fisier din primul folder al workspace-ului curent. Daca nu exista niciun workspace deschis, se afiseaza un mesaj informativ.

<u>**Parameters:**</u>
- **filename**: numele fisierului pentru care se doreste obtinerea URI-ului

<u>**Usage:**</u>
Pentru a folosi aceasta functie, trebuie sa ii furnizati numele fisierului pentru care doriti sa obtineti URI-ul. Functia va returna URI-ul daca exista un workspace deschis sau va afisa un mesaj informativ in caz contrar.

### **deleteUser()**

<u>**Description:**</u>
Aceasta functie verifica daca exista un utilizator cu adresa de email specificata si, in caz afirmativ, il sterge din baza de date. Daca utilizatorul nu exista, se va returna un mesaj de eroare.

<u>**Parameters:**</u>
- **email**: Adresa de email a utilizatorului care urmeaza sa fie sters

<u>**Usage:**</u>
Pentru a utiliza aceasta functie, trebuie sa ii furnizati adresa de email a utilizatorului pe care doriti sa il stergeti. Functia va returna un obiect de tip UserResponse care indica daca stergerea a avut succes sau a intampinat o eroare.

# **Components**

### **EditUser**

<u>**Description:**</u>
A React component that allows editing user details in a user management system.

<u>**Props:**</u>


<u>**Usage:**</u>
To use the EditUser component, simply integrate it into your React application, ensuring that the necessary dependencies such as 'useNavigate', 'useParams', 'useState', and 'useEffect' are imported. The component can then be rendered on a route where user details need to be edited. When the component is accessed, it fetches user data based on the provided email parameter and allows the user to update the name and verification status. Upon submitting the form, the user details are updated via UserHandler.updateUser and success/error messages are displayed accordingly.
