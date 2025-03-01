<?php
/**
 * поиск - обработка на сервере
 */
class Search
{
    public function __construct()
    {
        $this->init();
    }

    public function init()
    {
        add_action('wp_ajax_load_search_result', [__CLASS__, 'load_search_results']);
        add_action('wp_ajax_nopriv_load_search_result', [__CLASS__, 'load_search_results']);
    }

     /**
     * получение пост резкльтатов
     */
    static function load_search_results()
    {
        $post_type = isset($_POST['post_type']) ? $_POST['post_type'] : '';
        $query = isset($_POST['query']) ? $_POST['query'] : '';
        isset($_POST['flag']) && $_POST['flag'] === 'true' ? $flag = true : $flag = false;

        if (empty($post_type) || empty($query)) {
            wp_send_json_error('Вы не передали параметры для запроса', 400);
            wp_die(); // Завершаем выполнение
        }

        $args = self::get_query_args($post_type, $query);
        $new_query = new WP_Query($args);

        if (!$new_query->have_posts()) {
            wp_send_json_error('Nothing to show', 404);
            wp_die(); // Завершаем выполнение
        }

        // Генерация HTML для поисковой строки
        $html = '';
        if (!$flag) {
            $html = self::generate_html_for_search($new_query);
        } elseif ($flag && $post_type == 'datasets') {
            $html = self::generate_html_for_container_dataset($new_query);
        }
        wp_send_json_success($html);
        wp_die(); // Завершаем выполнение
    }

    /**
     * собираем аргументы query запросу
     */
    protected static function get_query_args($post_type, $query)
    {
        return [
            'post_type' => $post_type,
            'posts_per_page' => -1,
            'post_status' => 'publish',
            's' => $query,
        ];
    }

    /**
     * формируем разметку для быстрого поиска
     */
    protected static function generate_html_for_search(WP_Query $query)
    {
        ob_start();

        if ($query->have_posts()) :
            while ($query->have_posts()) :
                $query->the_post(); ?>
                <a href="<?php the_permalink(); ?>">
                    <div class="search_post">
                        <div class="img-wrapper">
                            <?php the_post_thumbnail('thumbnail'); ?>
                        </div>
                        <div class="flex-column">
                            <h4 class="h-reset"><?php the_title(); ?></h4>
                            <?php the_excerpt(); ?>
                        </div>
                    </div>
                </a>
            <?php endwhile;
        endif;

        wp_reset_postdata();
        return ob_get_clean();
    }

     /**
     * формируем разметку для встраивания в основной контейнер
     */
    protected static function generate_html_for_container_dataset(WP_Query $query)
    {
        ob_start();

        if ($query->have_posts()) :
            while ($query->have_posts()) :
                $query->the_post(); ?>
                <li data-post-id="<?php echo get_the_ID(); ?>">
                    <a href="<?php the_permalink(); ?>" class="img-wrap">
                        <?php $dataset_gallery_images_images = get_field('dataset-gallery_images');
                        if ($dataset_gallery_images_images):
                            foreach ($dataset_gallery_images_images as $dataset_gallery_images_image): ?>
                                <img src="<?php echo esc_url($dataset_gallery_images_image['sizes']['datamarket']); ?>" width="256" height="182" loading="lazy" alt="<?php echo esc_attr($dataset_gallery_images_image['alt']); ?>" />
                            <?php endforeach;
                        endif;
                        $taxonomy = get_the_terms(get_the_ID(), 'data-availability');
                        if (!empty($taxonomy) && is_array($taxonomy)):
                            foreach ($taxonomy as $value): ?>
                                <span class="data_availability"><?php echo $value->name; ?></span>
                        <?php endforeach;
                        endif; ?>
                    </a>
                    <a href="<?php the_permalink(); ?>">
                        <h3 class="datamarket_posts_title"><?php the_title(); ?></h3>
                    </a>
                    <?php the_excerpt(); ?>
                </li>
            <?php endwhile;
        else: ?>
            <p>Nothing to show</p>
        <?php endif;

        wp_reset_postdata();
        return ob_get_clean();
    }
}

$search = new Search;



// PS:         wp_localize_script('datasets-script', 'admin_ajax', array('ajax_url' => admin_url('admin-ajax.php')));
