import './globals.scss';
import SwapForm from './SwapForm/Form';
import FooterInfo from './Footer/Info';
import styles from './App.module.scss';
import Header from './Header/Header';

function App() {
	return (
		<div className={styles.Container}>
			<Header />
			<SwapForm />
			<FooterInfo />
		</div>
	);
}

export default App;
