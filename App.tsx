
import React, { useState, useEffect } from 'react';
import { ProductType, OrderSubtype, OrderItem, CustomerData, Order } from './types';
import { Button } from './components/ui/Button';
import { OrderForm } from './components/OrderForm';
import { CartView } from './components/CartView';
import { CustomerInfo } from './components/CustomerInfo';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { generateOrderSummaryDescription } from './services/geminiService';
import { apiService } from './services/apiService';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';

enum Step {
  SELECT_CATEGORY,
  SELECT_PRODUCT,
  CONFIGURE,
  CHECKOUT,
  SUCCESS,
  ERROR,
  ADMIN
}

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.SELECT_CATEGORY);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<OrderSubtype | null>(null);
  const [activeType, setActiveType] = useState<ProductType | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAdminAuthenticated(authStatus);
  }, []);

  const selectCategory = (category: OrderSubtype) => {
    setActiveCategory(category);
    setStep(Step.SELECT_PRODUCT);
  };

  const selectProduct = (type: ProductType) => {
    setActiveType(type);
    setStep(Step.CONFIGURE);
  };

  const addToCart = (item: OrderItem | OrderItem[]) => {
    const itemsToAdd = Array.isArray(item) ? item : [item];
    setCart(prev => [...prev, ...itemsToAdd]);
    setStep(Step.SELECT_CATEGORY);
    setActiveCategory(null);
    setActiveType(null);
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const submitOrder = async (data: CustomerData) => {
    setCustomer(data);
    setIsSubmitting(true);
    
    const newOrderId = `ORD-${Date.now()}`;
    setOrderId(newOrderId);

    const fullOrder: Order = {
      orderNumber: newOrderId,
      customer: data,
      items: cart,
      createdAt: new Date().toISOString(),
      status: 'New',
      viewed: false
    };

    try {
      await apiService.submitOrder(fullOrder);
      const summary = await generateOrderSummaryDescription(fullOrder);
      setAiSummary(summary);
      setStep(Step.SUCCESS);
    } catch (error) {
      console.error("Order submission failed:", error);
      setErrorMessage("Произошла ошибка при отправке заказа.");
      setStep(Step.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setCart([]);
    setStep(Step.SELECT_CATEGORY);
    setActiveCategory(null);
    setActiveType(null);
    setCustomer(null);
    setErrorMessage('');
  };

  const toggleAdmin = () => {
    setStep(prev => prev === Step.ADMIN ? Step.SELECT_CATEGORY : Step.ADMIN);
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-[#4f46e5] bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-12 px-6 shadow-xl mb-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
             <h1 className="text-4xl font-black tracking-tight cursor-pointer" onClick={() => setStep(Step.SELECT_CATEGORY)}>PRINTMASTER PRO</h1>
             <p className="text-indigo-100 mt-2 font-medium">{t('home.subtitle')}</p>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="flex items-center gap-4">
            <div className="hidden md:block bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md">
              <p className="text-sm font-bold">WhatsApp: +972 509131305</p>
            </div>
            <button 
              onClick={toggleAdmin}
              className={`p-2 rounded-xl transition-all ${step === Step.ADMIN ? 'bg-white text-indigo-600' : 'bg-white/10 hover:bg-white/30 text-white'}`}
              title="Панель управления"
            >
              {step === Step.ADMIN ? '🏠' : '⚙️'}
            </button>
          </div>
        </div>
      </div>
    </header>

      <main className="max-w-6xl mx-auto px-6">
        
        {step === Step.SELECT_CATEGORY && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <h2 className="text-3xl font-bold text-center text-gray-800">{t('order.select_type')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <SelectionCard 
                title={t('order.school_design')} 
                icon="🏫" 
                desc={t('categories.school_desc')} 
                onClick={() => selectCategory(OrderSubtype.SCHOOL)} 
              />
              <SelectionCard 
                title={t('categories.team')} 
                icon="⚽" 
                desc={t('categories.team_desc')} 
                onClick={() => selectCategory(OrderSubtype.TEAM)} 
              />
              <SelectionCard 
                title={t('order.personal_design')} 
                icon="🎨" 
                desc={t('categories.personal_desc')} 
                onClick={() => selectCategory(OrderSubtype.PERSONAL)} 
              />
            </div>
            <CartView items={cart} onRemove={removeItem} onNext={() => setStep(Step.CHECKOUT)} />
          </div>
        )}

        {step === Step.SELECT_PRODUCT && activeCategory && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="text-center">
                <button onClick={() => setStep(Step.SELECT_CATEGORY)} className="text-indigo-600 font-bold hover:underline mb-4">{t('common.back_to_categories')}</button>
                <h2 className="text-3xl font-bold text-gray-800">{t('products.question')}</h2>
                <p className="text-gray-500">{t('common.category')}: {t(`categories.${activeCategory.toLowerCase()}`)}</p>
             </div>
             <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <ProductSmallCard 
                  title={t('products.tshirt')} 
                  icon="👕" 
                  onClick={() => selectProduct(ProductType.TSHIRT)} 
                />
                {activeCategory === OrderSubtype.TEAM && (
                  <ProductSmallCard 
                    title={t('products.tank_top')} 
                    icon="🎽" 
                    onClick={() => selectProduct(ProductType.TANK_TOP)} 
                  />
                )}
                {(activeCategory === OrderSubtype.SCHOOL || activeCategory === OrderSubtype.PERSONAL) && (
                  <ProductSmallCard 
                    title={t('products.hoodie')} 
                    icon="🧥" 
                    onClick={() => selectProduct(ProductType.HOODIE)} 
                  />
                )}
                {activeCategory === OrderSubtype.PERSONAL && (
                  <ProductSmallCard 
                    title={t('products.cap')} 
                    icon="🧢" 
                    onClick={() => selectProduct(ProductType.CAP)} 
                  />
                )}
             </div>
          </div>
        )}

        {step === Step.CONFIGURE && activeType && activeCategory && (
          <OrderForm 
            productType={activeType} 
            initialSubtype={activeCategory}
            onAddToCart={addToCart} 
            onCancel={() => setStep(Step.SELECT_PRODUCT)} 
          />
        )}

        {step === Step.CHECKOUT && (
          <CustomerInfo onSubmit={submitOrder} onBack={() => setStep(Step.SELECT_CATEGORY)} />
        )}

        {step === Step.ADMIN && (
          isAdminAuthenticated ? <AdminDashboard /> : <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}

        {step === Step.SUCCESS && (
          <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl mx-auto border-t-8 border-green-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('common.success_title')}</h2>
            <div className="flex flex-col items-center gap-2 mb-6">
               <p className="text-gray-500">{t('common.order_number')}:</p>
               <p className="text-2xl font-mono font-bold text-indigo-600 bg-indigo-50 inline-block px-4 py-2 rounded-xl">{orderId}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-left border border-gray-100 italic"><p className="text-gray-700 leading-relaxed">{aiSummary}</p></div>
            <Button onClick={reset} variant="primary" fullWidth>{t('common.new_order')}</Button>
          </div>
        )}

        {step === Step.ERROR && (
          <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl mx-auto border-t-8 border-red-500">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('common.error_title')}</h2>
            <p className="text-gray-600 mb-8">{errorMessage}</p>
            <Button onClick={() => setStep(Step.CHECKOUT)} variant="outline" fullWidth>{t('common.back')}</Button>
          </div>
        )}
      </main>
    </div>
  );
};

const SelectionCard: React.FC<{title: string, icon: string, desc: string, onClick: () => void}> = ({ title, icon, desc, onClick }) => {
  const { t } = useTranslation();
  return (
    <div onClick={onClick} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-400 text-center flex flex-col items-center h-full">
      <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      <div className="mt-auto pt-6 w-full">
         <span className="inline-block w-full bg-indigo-50 text-indigo-600 font-bold px-4 py-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase text-sm tracking-widest">{t('common.choose')}</span>
      </div>
    </div>
  );
};

const ProductSmallCard: React.FC<{title: string, icon: string, onClick: () => void}> = ({ title, icon, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-400 text-center">
    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
  </div>
);

export default App;
